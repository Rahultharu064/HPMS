import React, { useEffect, useMemo, useState } from 'react'
import { Search, Filter, Plus, Eye, Edit, Trash2, Calendar, Bed, Download } from 'lucide-react'

const Reservations = () => {
  const [reservations, setReservations] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    // TODO: Replace with GET /api/bookings with filters
    setReservations([
      { id: 1, guestName: 'John Doe', email: 'john@example.com', phone: '+977-984...', room: '201', roomType: 'Deluxe', checkIn: '2025-10-22', checkOut: '2025-10-25', adults: 2, children: 0, status: 'confirmed', totalAmount: 15000, paymentStatus: 'paid', createdAt: '2025-10-20', bookingSource: 'Direct' },
      { id: 2, guestName: 'Jane Smith', email: 'jane@example.com', phone: '+977-985...', room: '305', roomType: 'Suite', checkIn: '2025-10-23', checkOut: '2025-10-28', adults: 2, children: 1, status: 'pending', totalAmount: 25000, paymentStatus: 'pending', createdAt: '2025-10-20', bookingSource: 'OTA' }
    ])
  }, [])

  const filtered = useMemo(() => reservations.filter(r => {
    const s = searchQuery.toLowerCase()
    const matchesSearch = r.guestName.toLowerCase().includes(s) || r.email.toLowerCase().includes(s) || r.phone.includes(searchQuery)
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    const matchesDate = !dateFilter || r.checkIn === dateFilter
    return matchesSearch && matchesStatus && matchesDate
  }), [reservations, searchQuery, statusFilter, dateFilter])

  const statusBadge = (status) => ({
    confirmed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
    'checked-in': 'bg-blue-100 text-blue-700',
    'checked-out': 'bg-gray-100 text-gray-700'
  }[status] || 'bg-gray-100 text-gray-700')

  const paymentBadge = (status) => ({
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    refunded: 'bg-red-100 text-red-700'
  }[status] || 'bg-gray-100 text-gray-700')

  const open = (type, item=null) => { setModalType(type); setSelected(item); setShowModal(true) }
  const close = () => { setShowModal(false); setModalType(''); setSelected(null) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Reservations</h2>
        <div className="flex gap-3">
          <button onClick={() => open('create')} className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2"><Plus size={18}/>New</button>
          <button className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Download size={18}/>Export</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Name, email, phone" className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Room Type</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All</option>
            <option>Standard</option>
            <option>Deluxe</option>
            <option>Suite</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Date Range</label>
          <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="checked-in">Checked-in</option>
            <option value="checked-out">Checked-out</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Check-in Date</label>
          <input type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <div className="flex items-end">
          <button onClick={()=>{setSearchQuery('');setStatusFilter('all');setDateFilter('')}} className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Filter size={18}/>Clear</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{r.guestName}</div>
                    <div className="text-xs text-gray-500">{r.email} • {r.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center"><Bed className="text-gray-400 mr-2" size={16}/> <span className="text-sm text-gray-900">{r.room}</span></div>
                    <div className="text-xs text-gray-500">{r.roomType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center"><Calendar className="text-gray-400 mr-2" size={16}/> <span className="text-sm text-gray-900">{r.checkIn}</span></div>
                    <div className="text-xs text-gray-500">to {r.checkOut}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(r.status)}`}>{r.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentBadge(r.paymentStatus)}`}>{r.paymentStatus}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{r.totalAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.bookingSource}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button onClick={()=>open('view', r)} className="text-blue-600 hover:text-blue-900"><Eye size={16}/></button>
                      <button onClick={()=>open('edit', r)} className="text-green-600 hover:text-green-900"><Edit size={16}/></button>
                      <button onClick={()=>open('delete', r)} className="text-red-600 hover:text-red-900"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 capitalize">{modalType} reservation</h3>
              <button onClick={close} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24}/>
              </button>
            </div>
            <div className="text-gray-600 text-sm">Form and details go here.</div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={close} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Close</button>
              {modalType !== 'view' && (
                <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Save</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reservations


