import React, { useEffect, useMemo, useState } from 'react'
import { Search, CreditCard, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Download, Filter, Eye } from 'lucide-react'
import { bookingService } from '../../../services/bookingService'
import { exportToCsv } from '../../../utils/exportCsv'

const Billing = () => {
  const [payments, setPayments] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await bookingService.getAllBookings({ page: 1, limit: 100 })
        if (!res?.success) return
        const rows = []
        const seen = new Set()
        for (const b of (res.data || [])) {
          const guestName = [b.guest?.firstName, b.guest?.lastName].filter(Boolean).join(' ')
          const bookingCode = `BK-${String(b.id).padStart(4,'0')}`
          const roomLabel = b.room?.roomNumber || b.room?.id || ''
          for (const p of (b.payments || [])) {
            if (p?.id == null || seen.has(p.id)) continue
            seen.add(p.id)
            rows.push({
              id: p.id,
              bookingId: bookingCode,
              guest: guestName || '—',
              room: roomLabel,
              amount: p.amount || 0,
              method: String(p.method || '').toLowerCase(),
              status: String(p.status || '').toLowerCase(),
              txn: p.transactionId || `PMT-${p.id}`,
              createdAt: new Date(p.createdAt).toLocaleString()
            })
          }
        }
        setPayments(rows)
      } catch (e) {
        console.error('Failed to load payments', e)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => payments.filter(p => {
    const s = searchQuery.toLowerCase()
    const matchesSearch = p.guest.toLowerCase().includes(s) || p.bookingId.toLowerCase().includes(s) || p.txn.toLowerCase().includes(s)
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    const matchesMethod = methodFilter === 'all' || p.method === methodFilter
    return matchesSearch && matchesStatus && matchesMethod
  }), [payments, searchQuery, statusFilter, methodFilter])

  const statusBadge = (status) => ({ completed: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', failed: 'bg-red-100 text-red-700', refunded: 'bg-purple-100 text-purple-700' }[status] || 'bg-gray-100 text-gray-700')
  const methodBadge = (m) => ({ khalti: 'bg-purple-100 text-purple-700', esewa: 'bg-blue-100 text-blue-700', cash: 'bg-green-100 text-green-700', card: 'bg-gray-100 text-gray-700' }[m] || 'bg-gray-100 text-gray-700')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Billing & Payments</h2>
        <button onClick={() => exportToCsv('payments.csv', filtered)} className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Download size={18}/>Export</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Guest, booking ID, transaction" className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
          <select value={methodFilter} onChange={e=>setMethodFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All</option>
            <option value="khalti">Khalti</option>
            <option value="esewa">eSewa</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={()=>{setSearchQuery('');setStatusFilter('all');setMethodFilter('all')}} className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Filter size={18}/>Clear</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{p.guest}</div>
                    <div className="text-xs text-gray-500">Room {p.room}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.bookingId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{p.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 rounded-full text-xs font-medium ${methodBadge(p.method)}`}>{p.method?.toUpperCase()}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(p.status)}`}>{p.status}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.txn}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.createdAt}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm"><button onClick={()=>setSelected(p)} className="text-blue-600 hover:text-blue-900 flex items-center gap-1"><Eye size={16}/>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
              <button onClick={()=>setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="text-sm text-gray-700 space-y-2">
              <div className="flex justify-between"><span>Guest</span><span>{selected.guest}</span></div>
              <div className="flex justify-between"><span>Booking</span><span>{selected.bookingId}</span></div>
              <div className="flex justify-between"><span>Room</span><span>{selected.room}</span></div>
              <div className="flex justify-between"><span>Amount</span><span>₹{selected.amount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Method</span><span>{selected.method.toUpperCase()}</span></div>
              <div className="flex justify-between"><span>Status</span><span>{selected.status}</span></div>
              <div className="flex justify-between"><span>Transaction</span><span>{selected.txn}</span></div>
              <div className="flex justify-between"><span>Time</span><span>{selected.createdAt}</span></div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={()=>setSelected(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Billing


