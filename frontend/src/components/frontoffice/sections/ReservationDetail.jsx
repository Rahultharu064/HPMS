import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { bookingService } from '../../../services/bookingService'

const ReservationDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [booking, setBooking] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await bookingService.getBookingById(id)
        if (!res?.success) throw new Error('Failed to load booking')
        setBooking(res.booking)
      } catch (e) {
        setError(e.message || 'Failed to load booking')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const cancel = async () => {
    if (!confirm('Cancel this booking?')) return
    await bookingService.cancelBooking(id)
    // reload
    const res = await bookingService.getBookingById(id)
    if (res?.success) setBooking(res.booking)
  }

  const remove = async () => {
    if (!confirm('Permanently delete this booking?')) return
    await bookingService.deleteBooking(id)
    navigate('/front-office/reservations')
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!booking) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">Back</button>
          <h3 className="text-2xl font-bold mt-2">Reservation #{booking.id}</h3>
          <div className="text-gray-600">{booking.guest?.firstName} {booking.guest?.lastName} • Room #{booking.roomId}</div>
        </div>
        <div className="flex gap-2">
          {booking.status !== 'cancelled' && (
            <button onClick={cancel} className="px-4 py-2 rounded-lg border">Cancel</button>
          )}
          <button onClick={remove} className="px-4 py-2 rounded-lg border text-red-600">Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-500">Dates</div>
          <div className="font-semibold">{new Date(booking.checkIn).toLocaleDateString()} → {new Date(booking.checkOut).toLocaleDateString()}</div>
          <div className="text-sm text-gray-500 mt-1">Guests</div>
          <div className="font-semibold">{booking.adults} Adults • {booking.children} Children</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-500">Status</div>
          <div className="font-semibold capitalize">{booking.status}</div>
          <div className="text-sm text-gray-500 mt-1">Total</div>
          <div className="font-semibold">₹{(booking.totalAmount||0).toLocaleString()}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-500">Guest</div>
          <div className="font-semibold">{booking.guest?.firstName} {booking.guest?.lastName}</div>
          <div className="text-sm text-gray-500">{booking.guest?.email} • {booking.guest?.phone}</div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white">
        <div className="p-4 border-b font-semibold">Payments</div>
        <div className="p-4">
          {(booking.payments || []).length === 0 && (
            <div className="text-gray-500 text-sm">No payments</div>
          )}
          {(booking.payments || []).length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Method</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.payments.map(p => (
                    <tr key={p.id} className="border-t">
                      <td className="p-2">{p.id}</td>
                      <td className="p-2">{String(p.method||'').toUpperCase()}</td>
                      <td className="p-2">₹{(p.amount||0).toLocaleString()}</td>
                      <td className="p-2 capitalize">{p.status}</td>
                      <td className="p-2">{new Date(p.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReservationDetail
