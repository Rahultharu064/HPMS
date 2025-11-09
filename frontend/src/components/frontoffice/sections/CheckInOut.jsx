import React, { useCallback, useEffect, useState } from 'react'
import { Search, Users, Bed, Clock, CheckCircle, XCircle, Download, Plus } from 'lucide-react'
import { bookingService } from '../../../services/bookingService'
import { exportToCsv } from '../../../utils/exportCsv'
import toast from 'react-hot-toast'
import ExtraServices from './ExtraServices'

const CheckInOut = () => {
  const [tab, setTab] = useState('checkin')
  const [checkIns, setCheckIns] = useState([])
  const [checkOuts, setCheckOuts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [modal, setModal] = useState({ open: false, type: '', item: null })
  const [wf, setWf] = useState({ idType: '', idNumber: '', remarks: '', earlyCheckOut: false })
  const [selectedCheckInDate, setSelectedCheckInDate] = useState(new Date().toISOString().slice(0,10))
  const [selectedCheckOutDate, setSelectedCheckOutDate] = useState(new Date().toISOString().slice(0,10))


  const loadData = useCallback(async () => {
    try {
      // Check-ins (arrivals): include status pending or confirmed for selected date
      const [ciPending, ciConfirmed] = await Promise.all([
        bookingService.getAllBookings({ checkIn: selectedCheckInDate, status: 'pending', limit: 100 }),
        bookingService.getAllBookings({ checkIn: selectedCheckInDate, status: 'confirmed', limit: 100 })
      ])
      const ciMerged = [...(ciPending?.data || []), ...(ciConfirmed?.data || [])]
      const ciSeen = new Set()
      const ciData = ciMerged.filter(b => (ciSeen.has(b.id) ? false : (ciSeen.add(b.id), true))).map(b => ({
        id: b.id,
        guest: [b.guest?.firstName, b.guest?.lastName].filter(Boolean).join(' ') || '—',
        room: b.room?.roomNumber || b.room?.id,
        type: b.room?.roomType,
        checkIn: (b.checkIn||'').slice(0,10),
        checkOut: (b.checkOut||'').slice(0,10),
        status: b.status,
        bookingId: `BK-${String(b.id).padStart(4,'0')}`,
        amount: b.totalAmount || 0
      }))
      setCheckIns(ciData)

      // Check-outs (departures): guests currently confirmed and leaving on selected date
      const co = await bookingService.getAllBookings({ checkOut: selectedCheckOutDate, status: 'confirmed', limit: 100 })
      const coData = (co?.data || []).map(b => ({
        id: b.id,
        guest: [b.guest?.firstName, b.guest?.lastName].filter(Boolean).join(' ') || '—',
        room: b.room?.roomNumber || b.room?.id,
        type: b.room?.roomType,
        checkIn: (b.checkIn||'').slice(0,10),
        checkOut: (b.checkOut||'').slice(0,10),
        status: b.status,
        bookingId: `BK-${String(b.id).padStart(4,'0')}`,
        amount: b.totalAmount || 0,
        balance: 0
      }))
      setCheckOuts(coData)
    } catch (e) {
      console.error('Failed to load check-in/out', e)
    }
  }, [selectedCheckInDate, selectedCheckOutDate])

  useEffect(() => { loadData() }, [loadData])

  const filteredCheckIns = checkIns.filter(g => g.guest.toLowerCase().includes(searchQuery.toLowerCase()) || g.room.includes(searchQuery) || g.bookingId.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredCheckOuts = checkOuts.filter(g => g.guest.toLowerCase().includes(searchQuery.toLowerCase()) || g.room.includes(searchQuery))

  const open = (type, item) => { setModal({ open: true, type, item }); setWf({ idType: '', idNumber: '', remarks: '', earlyCheckOut: false }) }
  const close = () => { setModal({ open: false, type: '', item: null }); setWf({ idType: '', idNumber: '', remarks: '', earlyCheckOut: false }) }

  const complete = async () => {
    try {
      console.log('Starting check-in/out process for booking:', modal.item.id, 'Type:', modal.type)
      let responseMessage = ''

      if (modal.type === 'checkin') {
        console.log('Processing check-in for booking:', modal.item.id, 'Current status:', modal.item.status)

        // Only update status if it's pending; if already confirmed, just add workflow log
        if (modal.item.status === 'pending') {
          console.log('Updating booking status to confirmed')
          const res = await bookingService.updateBooking(modal.item.id, { status: 'confirmed' })
          console.log('Update response:', res)
          responseMessage = res.message || 'Check-in completed successfully'
        } else if (modal.item.status === 'confirmed') {
          responseMessage = 'Check-in workflow completed successfully'
        }

        console.log('Adding check-in workflow log')
        await bookingService.addWorkflowLog(modal.item.id, {
          type: 'checkin',
          idType: wf.idType,
          idNumber: wf.idNumber,
          remarks: wf.remarks
        })

        // If early check-out is selected, also complete check-out
        if (wf.earlyCheckOut) {
          console.log('Processing early check-out')
          const res = await bookingService.updateBooking(modal.item.id, { status: 'completed' })
          console.log('Early checkout update response:', res)
          await bookingService.addWorkflowLog(modal.item.id, {
            type: 'checkout',
            idType: wf.idType,
            idNumber: wf.idNumber,
            remarks: wf.remarks
          })
          responseMessage = res.message || 'Early check-out completed successfully'
        }
      }

      if (modal.type === 'checkout') {
        console.log('Processing check-out for booking:', modal.item.id)
        const res = await bookingService.updateBooking(modal.item.id, { status: 'completed' })
        console.log('Checkout update response:', res)
        await bookingService.addWorkflowLog(modal.item.id, {
          type: 'checkout',
          idType: wf.idType,
          idNumber: wf.idNumber,
          remarks: wf.remarks
        })
        responseMessage = res.message || 'Check-out completed successfully'
      }

      console.log('Process completed successfully, setting message:', responseMessage)
      toast.success(responseMessage)
      close()

      // Auto-refresh lists after status update
      console.log('Reloading data...')
      await loadData()

    } catch (e) {
      console.error('Error during check-in/out process:', e)
      toast.error(`Failed to complete ${modal.type}: ${e.message || 'Unknown error'}`)
      close()
    }
  }

  const exportCurrent = () => {
    const rows = (tab === 'checkin' ? filteredCheckIns : filteredCheckOuts).map(r => ({
      id: r.id,
      guest: r.guest,
      room: r.room,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      amount: r.amount,
      status: r.status
    }))
    const name = tab === 'checkin' ? 'arrivals_today.csv' : 'departures_today.csv'
    exportToCsv(name, rows)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Check-in & Check-out</h2>
          <p className="text-gray-600">Manage guest arrivals and departures</p>
        </div>
        <button onClick={exportCurrent} className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Download size={18}/>Export</button>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button onClick={() => setTab('checkin')} className={`flex-1 px-4 py-2 rounded-md ${tab==='checkin'?'bg-white text-blue-600 shadow-sm':'text-gray-600 hover:text-gray-900'}`}>Check-ins ({checkIns.length})</button>
        <button onClick={() => setTab('checkout')} className={`flex-1 px-4 py-2 rounded-md ${tab==='checkout'?'bg-white text-blue-600 shadow-sm':'text-gray-600 hover:text-gray-900'}`}>Check-outs ({checkOuts.length})</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search by guest, room, or booking ID..." className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          {tab === 'checkin' && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">Check-in Date</label>
              <input
                type="date"
                value={selectedCheckInDate}
                onChange={e => setSelectedCheckInDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          {tab === 'checkout' && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">Check-out Date</label>
              <input
                type="date"
                value={selectedCheckOutDate}
                onChange={e => setSelectedCheckOutDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {tab==='checkin' && (
        <div className="space-y-4">
          {filteredCheckIns.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Check-ins on {new Date(selectedCheckInDate).toLocaleDateString()}</h3>
              <p className="text-gray-600">There are no guests scheduled to check in on this date.</p>
            </div>
          ) : (
            filteredCheckIns.map(g => (
              <div key={g.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users size={22} className="text-blue-600"/>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{g.guest}</h3>
                      <p className="text-sm text-gray-600">Booking: {g.bookingId}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        g.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {g.status === 'confirmed' ? 'Pre-checked' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Room {g.room} • {g.type}</p>
                      <p className="text-sm text-gray-500">{g.checkIn} to {g.checkOut}</p>
                      <p className="text-sm font-medium text-gray-900">₹{g.amount.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={()=>open('checkin', g)}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                      >
                        <CheckCircle size={16}/>
                        {g.status === 'confirmed' ? 'Complete Check-in' : 'Check-in'}
                      </button>
                      <button
                        onClick={() => setModal({ open: true, type: 'services', item: g })}
                        className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                      >
                        <Plus size={16}/>
                        Services
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab==='checkout' && (
        <div className="space-y-4">
          {filteredCheckOuts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <XCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Check-outs on {new Date(selectedCheckOutDate).toLocaleDateString()}</h3>
              <p className="text-gray-600">There are no guests scheduled to check out on this date.</p>
            </div>
          ) : (
            filteredCheckOuts.map(g => (
              <div key={g.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <Users size={22} className="text-red-600"/>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{g.guest}</h3>
                      <p className="text-sm text-gray-600">Booking: {g.bookingId}</p>
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Checked-in
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Room {g.room} • {g.type}</p>
                      <p className="text-sm text-gray-500">Stayed: {g.checkIn} to {g.checkOut}</p>
                      <p className="text-sm font-medium text-gray-900">₹{g.amount.toLocaleString()}</p>
                    </div>
                    <button
                      onClick={()=>open('checkout', g)}
                      className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                    >
                      <XCircle size={16}/>
                      Check-out
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {modal.open && modal.type === 'services' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Extra Services for {modal.item?.guest}</h3>
              <button onClick={close} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <ExtraServices bookingId={modal.item?.id} />
          </div>
        </div>
      )}

      {modal.open && modal.type !== 'services' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 capitalize">{modal.type} Process</h3>
              <button onClick={close} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {/* Guest Info Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users size={20} className="text-blue-600"/>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{modal.item?.guest}</h4>
                  <p className="text-sm text-gray-600">Booking: {modal.item?.bookingId}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Room:</span>
                  <span className="ml-2 font-medium">{modal.item?.room} • {modal.item?.type}</span>
                </div>
                <div>
                  <span className="text-gray-500">Amount:</span>
                  <span className="ml-2 font-medium">₹{modal.item?.amount?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <label className="block text-gray-600 mb-1">ID Type *</label>
                <select
                  value={wf.idType}
                  onChange={e=>setWf(s=>({ ...s, idType: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select ID Type</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="National ID">National ID</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="citizenship">citizenship</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">ID Number *</label>
                <input
                  value={wf.idNumber}
                  onChange={e=>setWf(s=>({ ...s, idNumber: e.target.value }))}
                  placeholder="e.g., AB123456"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-gray-600 mb-1">Remarks</label>
                <textarea
                  value={wf.remarks}
                  onChange={e=>setWf(s=>({ ...s, remarks: e.target.value }))}
                  placeholder="Any special notes or observations..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {modal.type === 'checkin' && (
                <div className="md:col-span-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={wf.earlyCheckOut}
                      onChange={e=>setWf(s=>({ ...s, earlyCheckOut: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Check-out guest early</span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={close} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button
                onClick={complete}
                disabled={!wf.idType || !wf.idNumber}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <CheckCircle size={16}/>
                Complete {modal.type === 'checkin' ? 'Check-in' : 'Check-out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CheckInOut


