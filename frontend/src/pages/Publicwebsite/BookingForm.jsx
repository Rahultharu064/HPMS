import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { bookingService } from '../../services/bookingService'
import { roomService } from '../../services/roomService'
import { paymentService } from '../../services/paymentService'
import PaymentOptions from '../../components/booking/PaymentOptions'
import Header from '../../components/Publicwebsite/Layout/Header'
import Footer from '../../components/Publicwebsite/Layout/Footer'
import { API_BASE_URL } from '../../utils/api'

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(6),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  adults: z.coerce.number().int().min(1),
  children: z.coerce.number().int().min(0).optional().default(0),
  paymentMethod: z.string().min(1)
})

const BookingForm = () => {
  const navigate = useNavigate()
  const { roomId } = useParams()
  const [gateways, setGateways] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({ 
    resolver: zodResolver(schema), 
    defaultValues: { 
      adults: 1, 
      children: 0, 
      paymentMethod: 'cash',
      checkIn: '',
      checkOut: ''
    } 
  })

  const watchedValues = watch()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch room details
        if (roomId) {
          const roomResponse = await roomService.getRoomById(roomId)
          setRoom(roomResponse.room)
        }
        
        // Fetch payment gateways
        const gatewaysResponse = await paymentService.getGateways()
        setGateways(gatewaysResponse.gateways || [])
        
      } catch (error) {
        console.error('Error fetching data:', error)
        setGateways([{ code: 'cash', name: 'Cash', description: 'Pay at property', enabled: true }])
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [roomId])

  const calculateTotal = () => {
    if (!room || !watchedValues.checkIn || !watchedValues.checkOut) return 0
    
    const checkIn = new Date(watchedValues.checkIn)
    const checkOut = new Date(watchedValues.checkOut)
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
    
    return nights * room.price
  }

  const resolveRoomImageUrl = () => {
    if (!room) return null
    const src = room?.images?.[0]?.url || room?.images?.[0]?.path || room?.image?.[0]?.url || room?.image?.[0]?.path || room?.imageUrl || room?.image_url || room?.thumbnail
    if (!src) return null
    if (typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'))) return src
    const path = typeof src === 'string' ? src : ''
    if (!path) return null
    const normalized = path.startsWith('/') ? path : `/${path}`
    return `${API_BASE_URL}${normalized}`
  }

  const onSubmit = async (values) => {
    try {
      setSubmitting(true)
      
      // Validate dates
      if (!values.checkIn || !values.checkOut) {
        throw new Error('Please select check-in and check-out dates')
      }
      
      const checkInDate = new Date(values.checkIn)
      const checkOutDate = new Date(values.checkOut)
      
      if (checkOutDate <= checkInDate) {
        throw new Error('Check-out date must be after check-in date')
      }
      
      // Create booking
      const payload = { 
        ...values, 
        roomId: Number(roomId),
        checkIn: values.checkIn,
        checkOut: values.checkOut
      }
      
      const res = await bookingService.createBooking(payload)
      const booking = res.booking
      const amount = booking.totalAmount
      
      // Create payment
      const paymentResponse = await paymentService.createPayment({ 
        bookingId: booking.id, 
        method: values.paymentMethod, 
        amount 
      })
      
      // Handle different payment methods
      if (values.paymentMethod === 'khalti') {
        await paymentService.handleKhaltiPayment(paymentResponse)
      } else if (values.paymentMethod === 'esewa') {
        await paymentService.handleEsewaPayment(paymentResponse)
      } else {
        // For cash and card payments, redirect to confirmation
        navigate(`/booking/confirm/${booking.id}`)
      }
      
    } catch (e) {
      alert(e.message || 'Failed to complete booking')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking form...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 py-10 max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Booking Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Book Your Stay</h1>
                
                {room && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-900 mb-2">{room.name}</h3>
                    <p className="text-gray-600 text-sm">{room.description}</p>
                  </div>
                )}
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Guest Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Guest Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                        <input 
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          placeholder="First Name" 
                          {...register('firstName')} 
                        />
                        {errors.firstName && <p className="text-red-500 text-sm mt-1">First name is required</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                        <input 
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          placeholder="Last Name" 
                          {...register('lastName')} 
                        />
                        {errors.lastName && <p className="text-red-500 text-sm mt-1">Last name is required</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                        <input 
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          placeholder="Email" 
                          type="email" 
                          {...register('email')} 
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">Valid email is required</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                        <input 
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          placeholder="Phone" 
                          {...register('phone')} 
                        />
                        {errors.phone && <p className="text-red-500 text-sm mt-1">Phone is required</p>}
                      </div>
                    </div>
                  </div>

                  {/* Stay Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Stay Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Check-in Date</label>
                        <input 
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          type="date" 
                          {...register('checkIn')} 
                        />
                        {errors.checkIn && <p className="text-red-500 text-sm mt-1">Check-in is required</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Check-out Date</label>
                        <input 
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          type="date" 
                          {...register('checkOut')} 
                        />
                        {errors.checkOut && <p className="text-red-500 text-sm mt-1">Check-out is required</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Adults</label>
                        <input 
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          type="number" 
                          min="1" 
                          {...register('adults', { valueAsNumber: true })} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Children</label>
                        <input 
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          type="number" 
                          min="0" 
                          {...register('children', { valueAsNumber: true })} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Options */}
                  <PaymentOptions 
                    gateways={gateways}
                    value={watchedValues.paymentMethod}
                    onChange={(val) => setValue('paymentMethod', val)}
                  />

                  <button 
                    disabled={submitting} 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl px-6 py-4 font-semibold hover:shadow-lg transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Processing...' : 'Confirm Booking'}
                  </button>
                </form>
              </div>
            </div>

            {/* Booking Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Booking Summary</h3>
                
                {room && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={resolveRoomImageUrl() || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'} 
                        alt={room.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">{room.name}</h4>
                        <p className="text-sm text-gray-600">{room.roomType}</p>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Room Rate (per night)</span>
                        <span>₹{room.price.toLocaleString()}</span>
                      </div>
                      
                      {watchedValues.checkIn && watchedValues.checkOut && (
                        <>
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Nights</span>
                            <span>{Math.ceil((new Date(watchedValues.checkOut) - new Date(watchedValues.checkIn)) / (1000 * 60 * 60 * 24))}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Subtotal</span>
                            <span>₹{calculateTotal().toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Taxes & Fees (13%)</span>
                            <span>₹{(calculateTotal() * 0.13).toLocaleString()}</span>
                          </div>
                          <div className="border-t pt-2">
                            <div className="flex justify-between font-bold text-lg">
                              <span>Total</span>
                              <span className="text-blue-600">₹{(calculateTotal() * 1.13).toLocaleString()}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default BookingForm
