import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { bookingService } from '../../services/bookingService'
import { guestService } from '../../services/guestService'
import { roomService } from '../../services/roomService'
import { paymentService } from '../../services/paymentService'
import PaymentOptions from '../../components/booking/PaymentOptions'

import Header from '../../components/Publicwebsite/Layout/Header'
import Footer from '../../components/Publicwebsite/Layout/Footer'
import { API_BASE_URL } from '../../utils/api'

const baseSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(6),
  nationality: z.string().min(1, 'Nationality is required'),
  idType: z.string().min(1, 'ID Type is required'),
  idNumber: z.string().min(1, 'ID Number is required'),
  // idProof is a file input; validate presence loosely in UI, accept any file type, optional here
  idProof: z.any().optional(),
  // profilePhoto is guest face photo
  profilePhoto: z.any().optional(),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  adults: z.coerce.number().int().min(1),
  children: z.coerce.number().int().min(0).optional().default(0),
  paymentMethod: z.string().min(1),
  specialRequest: z.string().max(1000).optional().default('')
})

// Normalize free-text nationality to ISO-2 for South Asia
const COUNTRY_ALIASES = {
  IN: ['india', 'in', 'indian'],
  NP: ['nepal', 'np', 'nepali', 'nepalese'],
  BD: ['bangladesh', 'bd', 'bangladeshi'],
  PK: ['pakistan', 'pk', 'pakistani'],
  LK: ['sri lanka', 'srilanka', 'lk', 'sri lankan', 'sri-lanka'],
  BT: ['bhutan', 'bt', 'bhutanese'],
  MV: ['maldives', 'mv', 'maldivian'],
  AF: ['afghanistan', 'af', 'afghan']
}

const normalizeCountryToISO2 = (name) => {
  const n = String(name || '').trim().toLowerCase()
  if (!n) return null
  for (const [iso, aliases] of Object.entries(COUNTRY_ALIASES)) {
    if (aliases.includes(n)) return iso
  }
  return null
}

// South Asia country-specific ID patterns (mirror backend)
const COUNTRY_ID_RULES = {
  IN: {
    Passport: /^[A-Z][0-9]{7}$/,
    'National ID': /^(?:\d{4}\s?\d{4}\s?\d{4}|\d{12})$/, // Aadhaar
    'Voter ID': /^[A-Z]{3}[0-9]{7}$/,
    'Driver License': /^[A-Z]{2}\d{2}\d{11}$/,
    Citizenship: /^[A-Z0-9-]{6,20}$/
  },
  NP: {
    Passport: /^[A-Z][0-9]{7}$/,
    'National ID': /^[A-Z0-9-]{6,20}$/,
    'Driver License': /^[A-Z0-9-]{5,20}$/,
    Citizenship: /^[A-Z0-9-]{6,20}$/
  },
  BD: {
    Passport: /^[A-Z0-9]{8,9}$/,
    'National ID': /^(?:\d{10}|\d{13}|\d{17})$/,
    'Driver License': /^[A-Z0-9-]{5,20}$/,
    Citizenship: /^[A-Z0-9-]{6,20}$/
  },
  PK: {
    Passport: /^[A-Z]{2}\d{7}$/,
    'National ID': /^\d{5}-\d{7}-\d$/,
    'Driver License': /^[A-Z0-9-]{5,20}$/,
    Citizenship: /^[A-Z0-9-]{6,20}$/
  },
  LK: {
    Passport: /^[A-Z]\d{7}$/,
    'National ID': /^(?:\d{9}[VvXx]|\d{12})$/,
    'Driver License': /^[A-Z0-9-]{5,20}$/,
    Citizenship: /^[A-Z0-9-]{6,20}$/
  },
  BT: {
    Passport: /^[A-Z0-9]{8,9}$/,
    'National ID': /^\d{11}$/,
    'Driver License': /^[A-Z0-9-]{5,20}$/,
    Citizenship: /^[A-Z0-9-]{6,20}$/
  },
  MV: {
    Passport: /^[A-Z0-9]{8,9}$/,
    'National ID': /^[A-Z0-9]{5,20}$/,
    'Driver License': /^[A-Z0-9-]{5,20}$/,
    Citizenship: /^[A-Z0-9-]{6,20}$/
  },
  AF: {
    Passport: /^[A-Z]{1,2}\d{7}$/,
    'National ID': /^[A-Z0-9-]{6,20}$/,
    'Driver License': /^[A-Z0-9-]{5,20}$/,
    Citizenship: /^[A-Z0-9-]{6,20}$/
  }
}

const schema = baseSchema.superRefine((val, ctx) => {
  const norm = (s) => String(s || '').toLowerCase()
  const type = norm(val.idType)
  const num = String(val.idNumber || '')
  const add = (message) => ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['idNumber'], message })

  if (!type) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['idType'], message: 'ID Type is required' })
    return
  }

  // Prefer country-specific validation if we recognize nationality
  const iso = normalizeCountryToISO2(val.nationality)
  const exactType = ['passport','national id','driver license','voter id','other'].find(t => t === type) ? val.idType : val.idType
  const countryRule = iso && COUNTRY_ID_RULES?.[iso]?.[exactType]
  if (countryRule) {
    if (!countryRule.test(num)) {
      add(`Invalid ${val.idType} format for ${val.nationality}`)
    }
    return
  }

  // Fallback to generic idType rules
  switch (type) {
    case 'passport': {
      if (!/^[A-Z0-9]{6,12}$/i.test(num)) add('Passport number must be 6-12 alphanumeric characters')
      break
    }
    case 'national id': {
      if (!/^[A-Z0-9-]{6,20}$/i.test(num)) add('National ID must be 6-20 characters (letters, numbers, hyphen)')
      break
    }
    case 'driver license': {
      if (!/^[A-Z0-9-]{5,20}$/i.test(num)) add('Driver License must be 5-20 characters (letters, numbers, hyphen)')
      break
    }
    case 'voter id': {
      if (!/^[A-Z0-9]{5,20}$/i.test(num)) add('Voter ID must be 5-20 alphanumeric characters')
      break
    }
    case 'citizenship': {
      if (!/^[A-Z0-9-]{6,20}$/i.test(num)) add('Citizenship number must be 6-20 characters (letters, numbers, hyphen)')
      break
    }
    default: {
      if (num.length < 3 || num.length > 50) add('ID Number must be between 3 and 50 characters')
    }
  }
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
      nationality: '',
      idType: '',
      idNumber: '',
      checkIn: '',
      checkOut: '',
      specialRequest: ''
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

      // Validate ID proof file from form input
      const fileList = values?.idProof instanceof FileList ? values.idProof : (values?.idProof || [])
      const idFileToUse = fileList && fileList.length ? fileList[0] : null

      if (!idFileToUse) {
        throw new Error('Please upload a government ID proof image')
      }

      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!allowed.includes(idFileToUse.type)) {
        throw new Error('ID proof must be an image (JPEG, PNG, WEBP, GIF)')
      }
      const MAX_BYTES = 5 * 1024 * 1024
      if (idFileToUse.size > MAX_BYTES) {
        throw new Error('ID proof image too large (max 5MB)')
      }
      // Dimension check
      const dimsOk = await new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          resolve(img.width >= 400 && img.height >= 300)
        }
        img.onerror = () => resolve(false)
        const url = URL.createObjectURL(idFileToUse)
        img.src = url
      })
      if (!dimsOk) {
        throw new Error('ID proof image too small (min 400x300)')
      }

      // Validate Guest Profile Photo (optional): mime, size <= 5MB, dimensions >= 200x200
      const profList = values?.profilePhoto instanceof FileList ? values.profilePhoto : (values?.profilePhoto || [])
      const profFile = profList && profList.length ? profList[0] : null
      if (profFile) {
        const allowedP = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (!allowedP.includes(profFile.type)) {
          throw new Error('Profile photo must be an image (JPEG, PNG, WEBP, GIF)')
        }
        const MAX_BYTES = 5 * 1024 * 1024
        if (profFile.size > MAX_BYTES) {
          throw new Error('Profile photo too large (max 5MB)')
        }
        const dimsOkP = await new Promise((resolve) => {
          const img = new Image()
          img.onload = () => {
            resolve(img.width >= 200 && img.height >= 200)
          }
          img.onerror = () => resolve(false)
          const url = URL.createObjectURL(profFile)
          img.src = url
        })
        if (!dimsOkP) {
          throw new Error('Profile photo too small (min 200x200)')
        }
      }
      
      // Create booking (exclude idProof from payload; it's uploaded separately)
      const { idProof: _omit, profilePhoto: _omit2, ...cleanValues } = values
      const payload = { 
        ...cleanValues, 
        roomId: Number(roomId),
        checkIn: values.checkIn,
        checkOut: values.checkOut
      }
      
      const res = await bookingService.createBooking(payload)
      const booking = res.booking
      const amount = booking.totalAmount

      // Extract files (if provided) before redirecting to any external payment page
      const profFiles = values?.profilePhoto instanceof FileList ? values.profilePhoto : (values?.profilePhoto || [])
      const profileFile = profFiles && profFiles.length ? profFiles[0] : null

      // First, upload Guest Profile Photo to guest endpoint
      try {
        if (profileFile && booking && booking.guestId) {
          await guestService.uploadPhoto(booking.guestId, profileFile)
        }
      } catch (e) {
        // Non-blocking: continue even if upload fails
        console.warn('Profile photo upload failed:', e)
      }

      // Then, upload ID Proof to booking endpoint for validation/logging
      try {
        if (idFileToUse && booking && booking.id) {
          await bookingService.uploadIdProof(booking.id, idFileToUse)
        }
      } catch (e) {
        console.warn('ID proof upload failed:', e)
      }
      
      // Payment handling
      const method = String(values.paymentMethod || 'cash').toLowerCase()
      if (method === 'cash' || method === 'card') {
        // For cash/card, backend already created a completed payment; just go to confirmation
        navigate(`/booking/confirm/${booking.id}`)
      } else {
        // For online methods, create a payment and handle redirection
        const paymentResponse = await paymentService.createPayment({ 
          bookingId: booking.id, 
          method, 
          amount 
        })
        if (method === 'khalti') {
          await paymentService.handleKhaltiPayment(paymentResponse)
        } else if (method === 'esewa') {
          await paymentService.handleEsewaPayment(paymentResponse)
        }
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
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M10.53 4.47a.75.75 0 0 1 0 1.06L5.81 10.25H21a.75.75 0 0 1 0 1.5H5.81l4.72 4.72a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
            Back
          </button>
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
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Guest Profile Photo</label>
                        <input 
                          className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          type="file" 
                          accept="image/*"
                          {...register('profilePhoto')}
                        />
                        <p className="text-xs text-gray-500 mt-1">Add a clear face photo. Accepted: JPG, PNG, WEBP. Max 5MB. This is separate from Government ID.</p>
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
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nationality</label>
                        <input 
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          placeholder="e.g., Nepalese" 
                          {...register('nationality')} 
                        />
                        {errors.nationality && <p className="text-red-500 text-sm mt-1">Nationality is required</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Government ID Type</label>
                        <select 
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          {...register('idType')}
                        >
                          <option value="">Select ID Type</option>
                          <option value="Passport">Passport</option>
                          <option value="National ID">National ID</option>
                          <option value="Driver License">Driver License</option>
                          <option value="Citizenship">Citizenship</option>
                          <option value="Voter ID">Voter ID</option>
                          <option value="Other">Other</option>
                        </select>
                        {errors.idType && <p className="text-red-500 text-sm mt-1">ID Type is required</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">ID Number</label>
                        <input 
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          placeholder="Enter ID Number" 
                          {...register('idNumber')} 
                        />
                        {errors.idNumber && <p className="text-red-500 text-sm mt-1">ID Number is required</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Government ID Proof</label>
                        <input
                          className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          {...register('idProof')}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Upload a clear image of your government ID. Accepted: JPG, PNG, WEBP, GIF. Max 5MB, min 400x300px.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Special Request */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Special Request</h3>
                    <textarea
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                      placeholder="Any special requests (optional)"
                      {...register('specialRequest')}
                    />
                    {errors.specialRequest && <p className="text-red-500 text-sm mt-1">{errors.specialRequest.message}</p>}
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
