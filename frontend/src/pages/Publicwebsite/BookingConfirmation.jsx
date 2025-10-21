import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { bookingService } from '../../services/bookingService'
import { buildMediaUrl } from '../../utils/media'

const BookingConfirmation = () => {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await bookingService.getBookingById(id)
        if (mounted) setData(res.booking)
      } catch (e) {
        setError(e.message || 'Failed to load booking')
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [id])

  const getPrimaryImage = (room) => {
    const val = room?.image
    if (Array.isArray(val) && val.length > 0) return buildMediaUrl(val[0]?.url)
    return null
  }

  if (loading) return <div className="container mx-auto px-4 py-10">Loading booking...</div>
  if (error) return <div className="container mx-auto px-4 py-10 text-red-600">{error}</div>
  if (!data) return null

  const nights = Math.max(1, Math.ceil((new Date(data.checkOut) - new Date(data.checkIn)) / (1000*60*60*24)))

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Booking Confirmed</h1>
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex items-start gap-4">
          {getPrimaryImage(data.room) && (
            <img src={getPrimaryImage(data.room)} alt={data.room.name} className="w-32 h-24 object-cover rounded" />
          )}
          <div>
            <h2 className="text-xl font-semibold">{data.room.name}</h2>
            <p className="text-gray-600">Booking ID: <span className="font-mono">{data.id}</span></p>
            <p className="text-gray-600">Status: <span className="font-semibold capitalize">{data.status}</span></p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded p-4">
            <h3 className="font-semibold mb-2">Stay Details</h3>
            <p>Check-in: {new Date(data.checkIn).toLocaleDateString()}</p>
            <p>Check-out: {new Date(data.checkOut).toLocaleDateString()}</p>
            <p>Nights: {nights}</p>
            <p>Guests: {data.adults} adults{data.children ? `, ${data.children} children` : ''}</p>
          </div>
          <div className="bg-gray-50 rounded p-4">
            <h3 className="font-semibold mb-2">Guest</h3>
            <p>{data.guest.firstName} {data.guest.lastName}</p>
            <p>{data.guest.email}</p>
            <p>{data.guest.phone}</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded p-4">
          <h3 className="font-semibold mb-2">Payment</h3>
          {data.payments && data.payments.length > 0 ? (
            <ul className="list-disc pl-5">
              {data.payments.map(p => (
                <li key={p.id}>#{p.id} • {p.method} • {p.status} • ₹{p.amount}</li>
              ))}
            </ul>
          ) : (
            <p>No payments recorded.</p>
          )}
          <div className="mt-2 font-semibold">Total: ₹{data.totalAmount}</div>
        </div>
        <div className="flex gap-3 pt-2">
          <Link to="/rooms" className="px-4 py-2 bg-blue-600 text-white rounded">Browse More Rooms</Link>
          <Link to={`/rooms/${data.roomId}`} className="px-4 py-2 bg-gray-100 rounded">View Room</Link>
          <Link to="/guest/profile" className="px-4 py-2 bg-gray-100 rounded">Guest Profile</Link>
        </div>
      </div>
    </div>
  )
}

export default BookingConfirmation
