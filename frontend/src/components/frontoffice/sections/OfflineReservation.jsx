import React, { useState, useCallback } from 'react'
import { Calendar, Clock, Users, MapPin, CreditCard, CheckCircle, Upload, Phone, Mail, User as UserIcon, Car, Plane, Home as HomeIcon } from 'lucide-react'
import { bookingService } from '../../../services/bookingService'
import { roomService } from '../../../services/roomService'
import { useSearchParams } from 'react-router-dom'

const OfflineReservation = () => {
  const [searchParams] = useSearchParams()
  const bookingIdParam = searchParams.get('id')
  const isEditing = Boolean(bookingIdParam)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    dateOfBirth: '',
    nationality: '',
    phoneNumber: '',
    email: '',
    idType: '',
    idNumber: '',
    address: '',
    modeOfArrival: '',
    source: 'offline',
    checkInDate: '',
    checkOutDate: '',
    arrivalTime: '',
    departureTime: '',
    adults: 1,
    children: 0,
    roomType: '',
    numberOfRooms: 1,
    roomRate: 0,
    purposeOfStay: '',
    selectedRooms: [],
    specialRequests: '',
    paymentMethod: '',
    advancePayment: 0,
    discountCode: '',
    bookingStatus: 'pending',
    sendConfirmation: { email: false, sms: false, print: false }
  })

  const [availableRooms, setAvailableRooms] = useState([])

  React.useEffect(() => {
    (async () => {
      try {
        const res = await roomService.getRooms(1, 100)
        if (res?.success) {
          setAvailableRooms((res.data || []).map(r => ({
            id: r.id,
            type: r.roomType,
            number: r.roomNumber,
            rate: r.price,
            status: r.status,
            thumbnail: r.image?.[0]?.url
          })))
        }
      } catch (e) {
        console.error('Failed to load rooms', e)
      }
    })()
  }, [])

  // Load existing booking for edit mode
  React.useEffect(() => {
    (async () => {
      if (!isEditing) return
      try {
        const res = await bookingService.getBookingById(bookingIdParam)
        if (res?.success && res.booking) {
          const b = res.booking
          const fullName = [b.guest?.firstName, b.guest?.lastName].filter(Boolean).join(' ')
          setFormData(prev => ({
            ...prev,
            fullName,
            email: b.guest?.email || '',
            phoneNumber: b.guest?.phone || '',
            nationality: b.guest?.nationality || '',
            idType: b.guest?.idType || '',
            idNumber: b.guest?.idNumber || '',
            address: b.guest?.address || '',
            modeOfArrival: b.guest?.modeOfArrival || '',
            source: b.source || 'offline',
            dateOfBirth: b.guest?.dateOfBirth ? String(b.guest.dateOfBirth).slice(0,10) : '',
            checkInDate: (b.checkIn||'').slice(0,10),
            checkOutDate: (b.checkOut||'').slice(0,10),
            adults: b.adults || 1,
            children: b.children || 0,
            roomType: b.room?.roomType ? b.room.roomType.toLowerCase() : '',
            numberOfRooms: 1,
            roomRate: b.room?.price || 0,
            selectedRooms: b.room?.id ? [b.room.id] : [],
            paymentMethod: b.payments?.[0]?.method || '',
            bookingStatus: b.status || 'pending'
          }))
        }
      } catch (e) {
        console.error('Failed to load booking', e)
      }
    })()
  }, [isEditing, bookingIdParam])

  const steps = [
    { id: 1, title: 'Guest Information', icon: UserIcon },
    { id: 2, title: 'Reservation Details', icon: Calendar },
    { id: 3, title: 'Room Assignment', icon: HomeIcon },
    { id: 4, title: 'Payment Details', icon: CreditCard },
    { id: 5, title: 'Confirmation', icon: CheckCircle }
  ]

  const calculateTotal = () => {
    const baseAmount = formData.roomRate * formData.numberOfRooms
    const tax = baseAmount * 0.13
    const discount = formData.discountCode ? baseAmount * 0.1 : 0
    return baseAmount + tax - discount - formData.advancePayment
  }

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const nextStep = () => { if (currentStep < 5) setCurrentStep(currentStep + 1) }
  const prevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1) }

  const StepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <div key={step.id} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${currentStep >= step.id ? 'bg-[#2F5233] text-white' : 'bg-gray-200 text-gray-500'}`}>
                <Icon size={18} />
              </div>
              <span className={`text-xs font-medium hidden sm:block ${currentStep >= step.id ? 'text-[#2F5233]' : 'text-gray-500'}`}>
                {step.title}
              </span>
            </div>
          )
        })}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-[#2F5233] h-2 rounded-full transition-all duration-300" style={{ width: `${(currentStep / steps.length) * 100}%` }}></div>
      </div>
    </div>
  )

  // Reservation type selection removed for offline-only flow

  const GuestInformationStep = () => (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-[#1C1C1C] mb-6">Guest Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input type="text" value={formData.fullName || ''} onChange={(e) => handleInputChange('fullName', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent" placeholder="Enter full name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
          <div className="flex space-x-4">
            {['Male', 'Female', 'Other'].map(g => (
              <label key={g} className="flex items-center">
                <input type="radio" name="gender" value={g.toLowerCase()} checked={formData.gender === g.toLowerCase()} onChange={(e) => handleInputChange('gender', e.target.value)} className="mr-2 text-[#2F5233] focus:ring-[#2F5233]" />
                {g}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
          <input type="date" value={formData.dateOfBirth || ''} onChange={(e) => handleInputChange('dateOfBirth', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
          <input type="text" value={formData.nationality || ''} onChange={(e) => handleInputChange('nationality', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent" placeholder="Enter nationality" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 text-gray-400" size={20} />
            <input type="tel" value={formData.phoneNumber || ''} onChange={(e) => handleInputChange('phoneNumber', e.target.value)} className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent" placeholder="+977 98XXXXXXXX" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
            <input type="email" value={formData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent" placeholder="guest@email.com" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Government ID Type</label>
          <select value={formData.idType || ''} onChange={(e) => handleInputChange('idType', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent">
            <option value="">Select ID Type</option>
            <option value="passport">Passport</option>
            <option value="citizenship">Citizenship</option>
            <option value="license">Driving License</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ID Number</label>
          <input type="text" value={formData.idNumber || ''} onChange={(e) => handleInputChange('idNumber', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent" placeholder="Enter ID number" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload ID Proof</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#A6CF98] transition-colors">
            <Upload className="mx-auto mb-2 text-gray-400" size={32} />
            <p className="text-gray-600">Click to upload or drag and drop</p>
            <p className="text-sm text-gray-500">PNG, JPG, PDF up to 10MB</p>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Permanent Address</label>
          <textarea value={formData.address || ''} onChange={(e) => handleInputChange('address', e.target.value)} rows={3} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent" placeholder="Enter permanent address" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mode of Arrival</label>
          <select value={formData.modeOfArrival || ''} onChange={(e) => handleInputChange('modeOfArrival', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent">
            <option value="">Select arrival mode</option>
            <option value="car">Car</option>
            <option value="bus">Bus</option>
            <option value="train">Train</option>
            <option value="plane">Plane</option>
            <option value="walkin">Walk-in</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
    </div>
  )

  const ReservationDetailsStep = () => (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-[#1C1C1C] mb-6">Reservation Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Reservation Source</label>
          <select value={formData.source || ''} onChange={(e) => handleInputChange('source', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent">
            <option value="offline">Offline (Front Desk)</option>
            <option value="website">Online (Website)</option>
            <option value="agency">Travel Agency</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Check-in Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
            <input type="date" value={formData.checkInDate || ''} onChange={(e) => handleInputChange('checkInDate', e.target.value)} className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Check-out Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
            <input type="date" value={formData.checkOutDate || ''} onChange={(e) => handleInputChange('checkOutDate', e.target.value)} className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent" />
          </div>
        </div>
        <div>
          <label className="block text sm font-medium text-gray-700 mb-2">Arrival Time</label>
          <div className="relative">
            <Clock className="absolute left-3 top-3 text-gray-400" size={20} />
            <input type="time" value={formData.arrivalTime || ''} onChange={(e) => handleInputChange('arrivalTime', e.target.value)} className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent" />
          </div>
        </div>
        <div>
          <label className="block text sm font-medium text-gray-700 mb-2">Departure Time</label>
          <div className="relative">
            <Clock className="absolute left-3 top-3 text-gray-400" size={20} />
            <input type="time" value={formData.departureTime || ''} onChange={(e) => handleInputChange('departureTime', e.target.value)} className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Adults</label>
          <div className="flex items-center">
            <button type="button" onClick={() => handleInputChange('adults', Math.max(1, formData.adults - 1))} className="p-2 bg-gray-200 rounded-l-lg hover:bg-gray-300">-</button>
            <input type="number" value={formData.adults || 1} onChange={(e) => handleInputChange('adults', parseInt(e.target.value) || 1)} className="w-full p-3 border-t border-b border-gray-300 text-center focus:ring-2 focus:ring-[#2F5233] focus:border-transparent" min="1" />
            <button type="button" onClick={() => handleInputChange('adults', formData.adults + 1)} className="p-2 bg-gray-200 rounded-r-lg hover:bg-gray-300">+</button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Children</label>
          <div className="flex items-center">
            <button type="button" onClick={() => handleInputChange('children', Math.max(0, formData.children - 1))} className="p-2 bg-gray-200 rounded-l-lg hover:bg-gray-300">-</button>
            <input type="number" value={formData.children || 0} onChange={(e) => handleInputChange('children', parseInt(e.target.value) || 0)} className="w-full p-3 border-t border-b border-gray-300 text-center focus:ring-2 focus:ring-[#2F5233] focus:border-transparent" min="0" />
            <button type="button" onClick={() => handleInputChange('children', formData.children + 1)} className="p-2 bg-gray-200 rounded-r-lg hover:bg-gray-300">+</button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Room Type</label>
          <select value={formData.roomType || ''} onChange={(e) => handleInputChange('roomType', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent">
            <option value="">Select room type</option>
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="deluxe">Deluxe</option>
            <option value="suite">Suite</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Rooms</label>
          <select value={formData.numberOfRooms || 1} onChange={(e) => handleInputChange('numberOfRooms', parseInt(e.target.value))} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent">
            {[1,2,3,4,5].map(num => (
              <option key={num} value={num}>{num} Room{num > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Room Rate (NPR)</label>
          <input type="number" value={formData.roomRate || 0} onChange={(e) => handleInputChange('roomRate', parseFloat(e.target.value) || 0)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent" placeholder="0" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Purpose of Stay (Optional)</label>
          <textarea value={formData.purposeOfStay || ''} onChange={(e) => handleInputChange('purposeOfStay', e.target.value)} rows={3} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent" placeholder="Business, leisure, conference, etc." />
        </div>
      </div>
    </div>
  )

  const RoomAssignmentStep = () => (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-[#1C1C1C] mb-6">Room Availability & Assignment</h2>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Available Rooms</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableRooms.filter(room => (room.status === 'available') && (!formData.roomType || room.type.toLowerCase() === formData.roomType)).map(room => (
            <div key={room.id} className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.selectedRooms.includes(room.id) ? 'border-[#2F5233] bg-[#F8FFF4]' : 'border-gray-200 hover:border-[#A6CF98]'}`} onClick={() => {
              const selected = formData.selectedRooms.includes(room.id) ? formData.selectedRooms.filter(id => id !== room.id) : [...formData.selectedRooms, room.id]
              handleInputChange('selectedRooms', selected)
            }}>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">{room.number || `Room #${room.id}`}</h4>
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Available</span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                {room.thumbnail && (<img src={room.thumbnail} alt={room.type} className="w-12 h-12 rounded object-cover border" />)}
                <p className="text-gray-600">{room.type} Room</p>
              </div>
              <p className="font-bold text-[#2F5233]">NPR {room.rate}/night</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests</label>
        <textarea value={formData.specialRequests || ''} onChange={(e) => handleInputChange('specialRequests', e.target.value)} rows={4} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent" placeholder="Near elevator, wheelchair access, extra bed, quiet room, etc." />
      </div>
    </div>
  )

  const PaymentDetailsStep = () => (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-[#1C1C1C] mb-6">Payment Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
          <select value={formData.paymentMethod || ''} onChange={(e) => handleInputChange('paymentMethod', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent">
            <option value="">Select payment method</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="online">Online Transfer</option>
            <option value="upi">UPI/QR Code</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Advance Payment (NPR)</label>
          <input type="number" value={formData.advancePayment || 0} onChange={(e) => handleInputChange('advancePayment', parseFloat(e.target.value) || 0)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent" placeholder="0" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Discount Coupon Code</label>
          <input type="text" value={formData.discountCode || ''} onChange={(e) => handleInputChange('discountCode', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent" placeholder="Enter coupon code" />
        </div>
      </div>
      <div className="bg-[#F8FFF4] rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between"><span>Room Rate × {formData.numberOfRooms} room(s)</span><span>NPR {(formData.roomRate * formData.numberOfRooms).toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Tax (13%)</span><span>NPR {(formData.roomRate * formData.numberOfRooms * 0.13).toLocaleString()}</span></div>
          {formData.discountCode && (<div className="flex justify-between text-green-600"><span>Discount (10%)</span><span>- NPR {(formData.roomRate * formData.numberOfRooms * 0.1).toLocaleString()}</span></div>)}
          <div className="flex justify-between text-red-600"><span>Advance Payment</span><span>- NPR {formData.advancePayment.toLocaleString()}</span></div>
          <hr className="my-2" />
          <div className="flex justify-between text-xl font-bold text-[#2F5233]"><span>Total Payable</span><span>NPR {calculateTotal().toLocaleString()}</span></div>
        </div>
      </div>
    </div>
  )

  const ConfirmationStep = () => (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-[#1C1C1C] mb-6">Booking Confirmation</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Booking Status</label>
          <select value={formData.bookingStatus || 'pending'} onChange={(e) => handleInputChange('bookingStatus', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent">
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Reservation ID</label>
          <input type="text" value={"HTL-" + new Date().getFullYear() + '-' + Math.random().toString(36).substring(2,8).toUpperCase()} readOnly className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50" />
        </div>
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Send Confirmation</h3>
        <div className="space-y-3">
          <label className="flex items-center"><input type="checkbox" checked={formData.sendConfirmation.email} onChange={(e) => handleInputChange('sendConfirmation', { ...formData.sendConfirmation, email: e.target.checked })} className="mr-3 text-[#2F5233] focus:ring-[#2F5233]" /><Mail className="mr-2 text-gray-400" size={18} />Send confirmation via Email</label>
          <label className="flex items-center"><input type="checkbox" checked={formData.sendConfirmation.sms} onChange={(e) => handleInputChange('sendConfirmation', { ...formData.sendConfirmation, sms: e.target.checked })} className="mr-3 text-[#2F5233] focus:ring-[#2F5233]" /><Phone className="mr-2 text-gray-400" size={18} />Send confirmation via SMS</label>
          <label className="flex items-center"><input type="checkbox" checked={formData.sendConfirmation.print} onChange={(e) => handleInputChange('sendConfirmation', { ...formData.sendConfirmation, print: e.target.checked })} className="mr-3 text-[#2F5233] focus:ring-[#2F5233]" /><CheckCircle className="mr-2 text-gray-400" size={18} />Print confirmation receipt</label>
        </div>
      </div>
      <div className="bg-[#F8FFF4] rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Reservation Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Guest:</strong> {formData.fullName || 'Not specified'}</p>
            <p><strong>Phone:</strong> {formData.phoneNumber || 'Not specified'}</p>
          </div>
          <div>
            <p><strong>Check-in:</strong> {formData.checkInDate || 'Not specified'}</p>
            <p><strong>Check-out:</strong> {formData.checkOutDate || 'Not specified'}</p>
          </div>
          <div>
            <p><strong>Guests:</strong> {formData.adults} Adults, {formData.children} Children</p>
            <p><strong>Rooms:</strong> {formData.numberOfRooms} × {formData.roomType || 'Not selected'}</p>
          </div>
          <div>
            <p><strong>Total Amount:</strong> NPR {(formData.roomRate * formData.numberOfRooms + (formData.roomRate * formData.numberOfRooms * 0.13) - (formData.discountCode ? formData.roomRate * formData.numberOfRooms * 0.1 : 0)).toLocaleString()}</p>
            <p><strong>Amount Due:</strong> NPR {calculateTotal().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch(currentStep) {
      case 1: return <GuestInformationStep />
      case 2: return <ReservationDetailsStep />
      case 3: return <RoomAssignmentStep />
      case 4: return <PaymentDetailsStep />
      case 5: return <ConfirmationStep />
      default: return <GuestInformationStep />
    }
  }

  const handleSubmit = async () => {
    try {
      if (!formData.checkInDate || !formData.checkOutDate) {
        alert('Please select check-in and check-out dates')
        return
      }
      if (!formData.roomType && formData.selectedRooms.length === 0) {
        alert('Please select at least one room or choose a room type')
        return
      }
      if (!formData.fullName || !formData.email || !formData.phoneNumber) {
        alert('Please fill guest name, email and phone number')
        return
      }

      const nameParts = String(formData.fullName).trim().split(/\s+/)
      const firstName = nameParts.shift() || ''
      const lastName = nameParts.join(' ') || '-'

      // For MVP pick first selected room as roomId; replace with actual roomId from inventory
      const roomId = formData.selectedRooms.length > 0 ? formData.selectedRooms[0] : undefined
      if (!roomId) {
        // If no concrete roomId, block submit for now to satisfy backend validation
        alert('Please select a specific room to continue')
        return
      }

      const payload = {
        roomId,
        checkIn: formData.checkInDate,
        checkOut: formData.checkOutDate,
        adults: formData.adults,
        children: formData.children,
        firstName,
        lastName,
        email: formData.email,
        phone: formData.phoneNumber,
        paymentMethod: formData.paymentMethod || 'Cash',
        source: formData.source || 'offline',
        // Optional extended guest fields
        nationality: formData.nationality || undefined,
        idType: formData.idType || undefined,
        idNumber: formData.idNumber || undefined,
        address: formData.address || undefined,
        modeOfArrival: formData.modeOfArrival || undefined,
        dateOfBirth: formData.dateOfBirth || undefined
      }

      if (!isEditing) {
        const res = await bookingService.createBooking(payload)
        if (res?.success) {
          alert('Reservation submitted successfully!')
          setCurrentStep(1)
          setFormData(prev => ({ ...prev, fullName: '', email: '', phoneNumber: '', selectedRooms: [], advancePayment: 0, discountCode: '' }))
        } else {
          alert(res?.error || 'Failed to create booking')
        }
      } else {
        const res = await bookingService.updateBooking(bookingIdParam, payload)
        if (res?.success) {
          alert('Reservation updated successfully!')
        } else {
          alert(res?.error || 'Failed to update booking')
        }
      }
    } catch (e) {
      alert(e?.message || 'Failed to create booking')
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FFF4] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1C1C1C] mb-2">{isEditing ? 'Edit Reservation' : 'Offline Reservation'}</h1>
          <p className="text-gray-600">Capture complete guest details with nationality and ID information</p>
        </div>
        <StepIndicator />
        <div className="mb-8">{renderCurrentStep()}</div>
        <div className="flex justify-between">
          <button onClick={prevStep} disabled={currentStep === 1} className={`px-6 py-3 rounded-lg font-medium transition-all ${currentStep === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-[#2F5233] border border-[#2F5233] hover:bg-[#F8FFF4]'}`}>Previous</button>
          {currentStep < 5 ? (
            <div className="flex gap-2">
              {isEditing && (
                <button onClick={async()=>{ const ok = confirm('Cancel this booking?'); if(!ok) return; try{ await bookingService.cancelBooking(bookingIdParam, 'Front office update'); alert('Booking cancelled'); } catch(e){ alert(e?.message||'Failed to cancel') } }} className="px-6 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors">Cancel Booking</button>
              )}
              <button onClick={nextStep} className="px-6 py-3 bg-[#2F5233] text-white rounded-lg font-medium hover:bg-[#1f3625] transition-colors">Next Step</button>
            </div>
          ) : (
            <div className="flex gap-2">
              {isEditing && (
                <button onClick={async()=>{ const ok = confirm('Delete this booking permanently?'); if(!ok) return; try{ await bookingService.deleteBooking(bookingIdParam); alert('Booking deleted'); } catch(e){ alert(e?.message||'Failed to delete') } }} className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">Delete</button>
              )}
              <button onClick={handleSubmit} className="px-8 py-3 bg-[#FFD670] text-[#1C1C1C] rounded-lg font-bold hover:bg-[#ffd04d] transition-colors">{isEditing ? 'Save Changes' : 'Submit Reservation'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OfflineReservation
