import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { bookingService } from '../../../services/bookingService'
import { getSocket } from '../../../utils/socket'

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Completed', value: 'completed' }
]

const Reservations = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState(null)
  

  const [filters, setFilters] = useState({
    status: '',
    guestName: '',
    roomId: '',
    startDate: '',
    endDate: ''
  })

  const queryParams = useMemo(() => {
    const q = {
      page: String(page),
      limit: String(limit)
    }
    if (filters.status) q.status = filters.status
    if (filters.guestName) q.guestName = filters.guestName
    if (filters.roomId) q.roomId = filters.roomId
    if (filters.startDate) q.checkIn = filters.startDate
    if (filters.endDate) q.checkOut = filters.endDate
    return q
  }, [page, limit, filters])

  const loadStats = useCallback(async () => {
    try {
      const res = await bookingService.getStats({
        startDate: filters.startDate,
        endDate: filters.endDate
      })
      setStats(res.stats)
    } catch {
      // soft fail
    }
  }, [filters.startDate, filters.endDate])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await bookingService.getAllBookings(queryParams)
      setItems(res.data || [])
      setTotalPages(res.totalPages || 1)
    } catch (e) {
      setError(e.message || 'Failed to load reservations')
    } finally {
      setLoading(false)
    }
  }, [queryParams])

  useEffect(() => {
    loadData()
    loadStats()
  }, [loadData, loadStats])

  useEffect(() => {
    const socket = getSocket()
    const onCreated = () => { loadData(); loadStats() }
    const onUpdated = () => { loadData(); loadStats() }
    const onCancelled = () => { loadData(); loadStats() }
    const onDeleted = () => { loadData(); loadStats() }
    socket.on('fo:booking:created', onCreated)
    socket.on('fo:booking:updated', onUpdated)
    socket.on('fo:booking:cancelled', onCancelled)
    socket.on('fo:booking:deleted', onDeleted)
    return () => {
      socket.off('fo:booking:created', onCreated)
      socket.off('fo:booking:updated', onUpdated)
      socket.off('fo:booking:cancelled', onCancelled)
      socket.off('fo:booking:deleted', onDeleted)
    }
  }, [loadData, loadStats])

  // Sync global search (?q=) to guestName filter
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('q') || ''
    setFilters(s => ({ ...s, guestName: q }))
    setPage(1)
  }, [location.search])

  const resetFilters = () => {
    setFilters({ status: '', guestName: '', roomId: '', startDate: '', endDate: '' })
    setPage(1)
  }

  const onChangeStatus = async (booking, newStatus) => {
    try {
      await bookingService.updateBooking(booking.id, { status: newStatus })
      await loadData()
      await loadStats()
    } catch (e) {
      alert(e.message || 'Failed to update status')
    }
  }

  const onCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return
    try {
      await bookingService.cancelBooking(id, 'Front desk action')
      await loadData()
      await loadStats()
    } catch (e) {
      alert(e.message || 'Failed to cancel booking')
    }
  }

  const onDelete = async (id) => {
    if (!confirm('Permanently delete this booking?')) return
    try {
      await bookingService.deleteBooking(id)
      await loadData()
      await loadStats()
    } catch (e) {
      alert(e.message || 'Failed to delete booking')
    }
  }

  

  const StatusBadge = ({ status }) => {
    const color = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    }[status] || 'bg-gray-100 text-gray-800'
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{status}</span>
  }

  const getPaidMethod = (booking) => {
    const list = Array.isArray(booking?.payments) ? booking.payments : []
    if (!list.length) return '—'
    const completed = list
      .filter(p => String(p.status).toLowerCase() === 'completed')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    if (!completed) return '—'
    const m = String(completed.method || '')
    return m ? m.charAt(0).toUpperCase() + m.slice(1) : '—'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">Reservations</h3>
        <button
          className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => navigate('/front-office/new-reservation')}
        >
          New Reservation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-500">Total Bookings</div>
          <div className="text-2xl font-bold">{stats?.totalBookings ?? '—'}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-500">Confirmed</div>
          <div className="text-2xl font-bold text-green-600">{stats?.confirmedBookings ?? '—'}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-500">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{stats?.pendingBookings ?? '—'}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-500">Revenue</div>
          <div className="text-2xl font-bold text-blue-600">NPR{(stats?.totalRevenue ?? 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border bg-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => { setFilters(s => ({ ...s, status: e.target.value })); setPage(1) }}
              className="w-full border rounded-xl px-3 py-2"
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Guest</label>
            <input
              value={filters.guestName}
              onChange={(e) => setFilters(s => ({ ...s, guestName: e.target.value }))}
              placeholder="Name or email"
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Room ID</label>
            <input
              value={filters.roomId}
              onChange={(e) => setFilters(s => ({ ...s, roomId: e.target.value }))}
              placeholder="e.g., 101"
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">From</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(s => ({ ...s, startDate: e.target.value }))}
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">To</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(s => ({ ...s, endDate: e.target.value }))}
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={() => { setPage(1); loadData(); loadStats(); }} className="px-4 py-2 rounded-xl border">Apply</button>
          <button onClick={resetFilters} className="px-4 py-2 rounded-xl border">Reset</button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left p-3">Booking</th>
                <th className="text-left p-3">Guest</th>
                <th className="text-left p-3">Room</th>
                <th className="text-left p-3">Dates</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Payment</th>
                <th className="text-left p-3">Amount</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-500">Loading...</td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-red-600">{error}</td>
                </tr>
              )}
              {!loading && !error && items.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-500">No reservations found</td>
                </tr>
              )}
              {!loading && !error && items.map(b => (
                <tr key={b.id} className="border-t">
                  <td className="p-3">#{b.id}</td>
                  <td className="p-3">
                    <div className="font-medium">{b.guest?.firstName} {b.guest?.lastName}</div>
                    <div className="text-gray-500 text-xs">{b.guest?.email}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">Room #{b.roomId}</div>
                    <div className="text-gray-500 text-xs">{b.room?.name}</div>
                  </td>
                  <td className="p-3">
                    <div>{new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}</div>
                    <div className="text-gray-500 text-xs">{b.adults} Adults · {b.children} Children</div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={b.status} />
                      <select
                        className="border rounded-lg px-2 py-1 text-xs"
                        value={b.status}
                        onChange={(e) => onChangeStatus(b, e.target.value)}
                      >
                        <option value="pending">pending</option>
                        <option value="confirmed">confirmed</option>
                        <option value="completed">completed</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    </div>
                  </td>
                  <td className="p-3">{getPaidMethod(b)}</td>
                  <td className="p-3 font-semibold">NPR{(b.totalAmount ?? 0).toLocaleString()}</td>
                  <td className="p-3">
                    <div className="flex gap-2 items-center flex-wrap">
                      <button className="px-3 py-1 rounded-lg border text-blue-600" onClick={() => navigate(`/front-office/reservations/${b.id}`)}>View</button>
                      <button className="px-3 py-1 rounded-lg border" onClick={() => navigate(`/frontoffice/guests/${b.guestId}`)}>Guest</button>
                      <button className="px-3 py-1 rounded-lg border" onClick={() => navigate(`/rooms/${b.roomId}`)}>Room</button>
                      {b.status === 'pending' && new Date(b.checkIn).toDateString() === new Date().toDateString() && (
                        <button className="px-3 py-1 rounded-lg border text-green-600" onClick={() => onChangeStatus(b, 'confirmed')}>Check-in</button>
                      )}
                      {b.status === 'confirmed' && new Date(b.checkOut).toDateString() === new Date().toDateString() && (
                        <button className="px-3 py-1 rounded-lg border text-red-600" onClick={() => onChangeStatus(b, 'completed')}>Check-out</button>
                      )}
                      {b.status !== 'cancelled' && (
                        <button className="px-3 py-1 rounded-lg border text-red-600" onClick={() => onCancel(b.id)}>Cancel</button>
                      )}
                      <button className="px-3 py-1 rounded-lg border text-gray-600" onClick={() => onDelete(b.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-3 border-t">
          <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded-lg border disabled:opacity-50">Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 rounded-lg border disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reservations

