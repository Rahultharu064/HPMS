import React, { useEffect, useState } from 'react'
import { Search, Users, Bed, Clock, CheckCircle, XCircle, Download } from 'lucide-react'

const CheckInOut = () => {
  const [tab, setTab] = useState('checkin')
  const [checkIns, setCheckIns] = useState([])
  const [checkOuts, setCheckOuts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [modal, setModal] = useState({ open: false, type: '', item: null })

  useEffect(() => {
    // TODO: Replace with APIs
    setCheckIns([{ id: 1, guest: 'John Doe', room: '201', type: 'Deluxe', checkIn: '2025-10-22', checkOut: '2025-10-25', status: 'pending', bookingId: 'BK001', amount: 15000 }])
    setCheckOuts([{ id: 1, guest: 'Sarah Wilson', room: '205', type: 'Standard', checkIn: '2025-10-20', checkOut: '2025-10-22', status: 'pending', bookingId: 'BK002', amount: 12000, balance: 0 }])
  }, [])

  const filteredCheckIns = checkIns.filter(g => g.guest.toLowerCase().includes(searchQuery.toLowerCase()) || g.room.includes(searchQuery) || g.bookingId.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredCheckOuts = checkOuts.filter(g => g.guest.toLowerCase().includes(searchQuery.toLowerCase()) || g.room.includes(searchQuery))

  const open = (type, item) => setModal({ open: true, type, item })
  const close = () => setModal({ open: false, type: '', item: null })

  const complete = () => close()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Check-in & Check-out</h2>
          <p className="text-gray-600">Manage guest arrivals and departures</p>
        </div>
        <button className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Download size={18}/>Export</button>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button onClick={() => setTab('checkin')} className={`flex-1 px-4 py-2 rounded-md ${tab==='checkin'?'bg-white text-blue-600 shadow-sm':'text-gray-600 hover:text-gray-900'}`}>Check-ins ({checkIns.length})</button>
        <button onClick={() => setTab('checkout')} className={`flex-1 px-4 py-2 rounded-md ${tab==='checkout'?'bg-white text-blue-600 shadow-sm':'text-gray-600 hover:text-gray-900'}`}>Check-outs ({checkOuts.length})</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search by guest, room, or booking ID..." className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
      </div>

      {tab==='checkin' && (
        <div className="space-y-4">
          {filteredCheckIns.map(g => (
            <div key={g.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"><Users size={22} className="text-blue-600"/></div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{g.guest}</h3>
                    <p className="text-sm text-gray-600">Booking: {g.bookingId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Room {g.room} • {g.type}</p>
                    <p className="text-sm text-gray-500">{g.checkIn} to {g.checkOut}</p>
                    <p className="text-sm font-medium text-gray-900">₹{g.amount.toLocaleString()}</p>
                  </div>
                  <button onClick={()=>open('checkin', g)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><CheckCircle size={16}/>Check-in</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='checkout' && (
        <div className="space-y-4">
          {filteredCheckOuts.map(g => (
            <div key={g.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center"><Users size={22} className="text-red-600"/></div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{g.guest}</h3>
                    <p className="text-sm text-gray-600">Booking: {g.bookingId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Room {g.room} • {g.type}</p>
                    <p className="text-sm text-gray-500">Stayed: {g.checkIn} to {g.checkOut}</p>
                    <p className="text-sm font-medium text-gray-900">₹{g.amount.toLocaleString()}</p>
                  </div>
                  <button onClick={()=>open('checkout', g)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"><XCircle size={16}/>Check-out</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 capitalize">{modal.type}</h3>
              <button onClick={close} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="text-gray-600 text-sm">Workflow fields go here (ID capture, signatures, etc.).</div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={close} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={complete} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Complete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CheckInOut


