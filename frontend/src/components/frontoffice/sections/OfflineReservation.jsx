import React, { useState, useCallback, useEffect } from 'react'
import { Calendar, Clock, Users, MapPin, CreditCard, CheckCircle, Upload, Phone, Mail, User as UserIcon, Car, Plane, Home as HomeIcon } from 'lucide-react'
import { bookingService } from '../../../services/bookingService'
import { roomService } from '../../../services/roomService'
import { roomTypeService } from '../../../services/roomTypeService'
import { packageService } from '../../../services/packageService'
import { couponService } from '../../../services/couponService'
import { useSearchParams } from 'react-router-dom'

const OfflineReservation = () => {
  const [searchParams] = useSearchParams()
  const bookingIdParam = searchParams.get('id')
  const isEditing = Boolean(bookingIdParam)
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
  const [roomTypes, setRoomTypes] = useState([])
  const [packages, setPackages] = useState([])
  const [coupons, setCoupons] = useState([])
  const [adultsFocused, setAdultsFocused] = useState(false)
  const [childrenFocused, setChildrenFocused] = useState(false)

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)

        // Load rooms
        const roomsRes = await roomService.getRooms(1, 100)
        if (roomsRes?.success) {
          setAvailableRooms((roomsRes.data || []).map(r => ({
            id: r.id,
            type: r.roomType,
            number: r.roomNumber,
            rate: r.price,
            status: r.status,
            thumbnail: r.image?.[0]?.url,
            maxAdults: r.maxAdults,
            maxChildren: r.maxChildren,
            numBeds: r.numBeds,
            size: r.size
          })))
        }

        // Load room types
        const roomTypesRes = await roomTypeService.getRoomTypes(1, 100)
        if (roomTypesRes?.success) {
          setRoomTypes(roomTypesRes.data || [])
        }

        // Load packages
        try {
          const packagesRes = await packageService.getAllPackages()
          if (packagesRes?.success) {
            setPackages(packagesRes.packages || [])
          }
        } catch (e) {
          console.error('Failed to load packages', e)
          setPackages([])
        }

        // Load coupons
        try {
          const couponsRes = await couponService.getAllCoupons()
          if (couponsRes?.success) {
            setCoupons(couponsRes.coupons || [])
          }
        } catch (e) {
          console.error('Failed to load coupons', e)
          setCoupons([])
        }

      } catch (e) {
        console.error('Failed to load initial data', e)
        setError('Failed to load initial data')
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Load existing booking for edit mode
  useEffect(() => {
    const loadBooking = async () => {
      if (!isEditing) return

      try {
        setLoading(true)
        const res = await bookingService.getBookingById(bookingIdParam)
        if (res?.success && res.booking) {
          const b = res.booking
          const fullName = [b.guest?.firstName, b.guest?.lastName].filter(Boolean).join(' ')
          setFormData(prev => ({
            ...prev,
            fullName,
            gender: b.guest?.gender || '',
            dateOfBirth: b.guest?.dateOfBirth || '',
            email: b.guest?.email || '',
            phoneNumber: b.guest?.phone || '',
            nationality: b.guest?.nationality || '',
            idType: b.guest?.idType || '',
            idNumber: b.guest?.idNumber || '',
            address: b.guest?.address || '',
            modeOfArrival: b.modeOfArrival || '',
            checkInDate: b.checkInDate ? new Date(b.checkInDate).toISOString().split('T')[0] : '',
            checkOutDate: b.checkOutDate ? new Date(b.checkOutDate).toISOString().split('T')[0] : '',
            arrivalTime: b.arrivalTime || '',
            departureTime: b.departureTime || '',
            adults: b.adults || 1,
            children: b.children || 0,
            roomType: b.roomType || '',
            numberOfRooms: b.numberOfRooms || 1,
            roomRate: b.roomRate || 0,
            purposeOfStay: b.purposeOfStay || '',
            selectedRooms: b.selectedRooms || [],
            specialRequests: b.specialRequests || '',
            paymentMethod: b.paymentMethod || '',
            advancePayment: b.advancePayment || 0,
            discountCode: b.discountCode || '',
            bookingStatus: b.status || 'pending',
            sendConfirmation: b.sendConfirmation || { email: false, sms: false, print: false }
          }))
        } else {
          setError(res?.error || 'Failed to load booking')
        }
      } catch (e) {
        console.error('Failed to load booking', e)
        setError('Failed to load booking')
      } finally {
        setLoading(false)
      }
    }

    loadBooking()
  }, [isEditing, bookingIdParam])

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  const nextStep = useCallback(() => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep])

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const calculateAge = (birthDate) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      // Age validation: only guests aged 16 or younger can reserve
      if (formData.dateOfBirth) {
        const age = calculateAge(formData.dateOfBirth)
        if (age > 16) {
          setError('Only guests aged 16 or younger can make reservations.')
          setLoading(false)
          return
        }
      }

      const bookingData = {
        ...formData,
        guest: {
          firstName: formData.fullName.split(' ')[0] || '',
          lastName: formData.fullName.split(' ').slice(1).join(' ') || '',
          email: formData.email,
          phone: formData.phoneNumber,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          nationality: formData.nationality,
          idType: formData.idType,
          idNumber: formData.idNumber,
          address: formData.address
        }
      }

      let res
      if (isEditing) {
        res = await bookingService.updateBooking(bookingIdParam, bookingData)
      } else {
        res = await bookingService.createBooking(bookingData)
      }

      if (res?.success) {
        setSuccess(isEditing ? 'Booking updated successfully!' : 'Booking created successfully!')
        if (!isEditing) {
          // Reset form for new booking
          setFormData({
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
          setCurrentStep(1)
        }
      } else {
        setError(res?.error || 'Failed to save booking')
      }
    } catch (e) {
      console.error('Failed to save booking', e)
      setError(e?.message || 'Failed to save booking')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!isEditing) return

    const ok = confirm('Cancel this booking?')
    if (!ok) return

    try {
      setLoading(true)
      const res = await bookingService.cancelBooking(bookingIdParam, 'Front office update')
      if (res?.success) {
        setSuccess('Booking cancelled successfully')
        setFormData(prev => ({ ...prev, bookingStatus: 'cancelled' }))
      } else {
        setError(res?.error || 'Failed to cancel booking')
      }
    } catch (e) {
      console.error('Failed to cancel booking', e)
      setError(e?.message || 'Failed to cancel booking')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBooking = async () => {
    if (!isEditing) return

    const ok = confirm('Delete this booking permanently?')
    if (!ok) return

    try {
      setLoading(true)
      const res = await bookingService.deleteBooking(bookingIdParam)
      if (res?.success) {
        setSuccess('Booking deleted successfully')
        // Redirect or reset form
      } else {
        setError(res?.error || 'Failed to delete booking')
      }
    } catch (e) {
      console.error('Failed to delete booking', e)
      setError(e?.message || 'Failed to delete booking')
    } finally {
      setLoading(false)
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderGuestDetails()
      case 2:
        return renderStayDetails()
      case 3:
        return renderRoomSelection()
      case 4:
        return renderPaymentDetails()
      case 5:
        return renderConfirmation()
      default:
        return renderGuestDetails()
    }
  }

  const renderGuestDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
            placeholder="Enter full name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
          <select
            value={formData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
          <input
            type="text"
            value={formData.nationality}
            onChange={(e) => handleInputChange('nationality', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
            placeholder="Enter nationality"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
            placeholder="Enter phone number"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
            placeholder="Enter email address"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ID Type</label>
          <select
            value={formData.idType}
            onChange={(e) => handleInputChange('idType', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
          >
            <option value="">Select ID type</option>
            <option value="passport">Passport</option>
            <option value="national_id">National ID</option>
            <option value="drivers_license">Driver's License</option>
            <option value="citizenship">Citizenship</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ID Number</label>
          <input
            type="text"
            value={formData.idNumber}
            onChange={(e) => handleInputChange('idNumber', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
            placeholder="Enter ID number"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
        <textarea
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
          rows="3"
          placeholder="Enter address"
        />
      </div>
    </div>
  )

  const renderStayDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Check-in Date *</label>
          <input
            type="date"
            value={formData.checkInDate}
            onChange={(e) => handleInputChange('checkInDate', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Check-out Date *</label>
          <input
            type="date"
            value={formData.checkOutDate}
            onChange={(e) => handleInputChange('checkOutDate', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Arrival Time</label>
          <input
            type="time"
            value={formData.arrivalTime}
            onChange={(e) => handleInputChange('arrivalTime', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Departure Time</label>
          <input
            type="time"
            value={formData.departureTime}
            onChange={(e) => handleInputChange('departureTime', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Adults</label>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => handleInputChange('adults', Math.max(1, formData.adults - 1))}
              className={`p-2 bg-gray-200 rounded-l-lg ${adultsFocused ? '' : 'hover:bg-gray-300'}`}
              style={{ pointerEvents: adultsFocused ? 'none' : 'auto' }}
            >
              -
            </button>
            <input
              type="number"
              value={formData.adults || 1}
              onChange={(e) => handleInputChange('adults', parseInt(e.target.value) || 1)}
              onFocus={() => setAdultsFocused(true)}
              onBlur={() => setAdultsFocused(false)}
              className="w-full p-3 border-t border-b border-gray-300 text-center focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
              min="1"
            />
            <button
              type="button"
              onClick={() => handleInputChange('adults', formData.adults + 1)}
              className={`p-2 bg-gray-200 rounded-r-lg ${adultsFocused ? '' : 'hover:bg-gray-300'}`}
              style={{ pointerEvents: adultsFocused ? 'none' : 'auto' }}
            >
              +
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Children</label>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => handleInputChange('children', Math.max(0, formData.children - 1))}
              className={`p-2 bg-gray-200 rounded-l-lg ${childrenFocused ? '' : 'hover:bg-gray-300'}`}
              style={{ pointerEvents: childrenFocused ? 'none' : 'auto' }}
            >
              -
            </button>
            <input
              type="number"
              value={formData.children || 0}
              onChange={(e) => handleInputChange('children', parseInt(e.target.value) || 0)}
              onFocus={() => setChildrenFocused(true)}
              onBlur={() => setChildrenFocused(false)}
              className="w-full p-3 border-t border-b border-gray-300 text-center focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
              min="0"
            />
            <button
              type="button"
              onClick={() => handleInputChange('children', formData.children + 1)}
              className={`p-2 bg-gray-200 rounded-r-lg ${childrenFocused ? '' : 'hover:bg-gray-300'}`}
              style={{ pointerEvents: childrenFocused ? 'none' : 'auto' }}
            >
              +
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mode of Arrival</label>
          <select
            value={formData.modeOfArrival}
            onChange={(e) => handleInputChange('modeOfArrival', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
          >
            <option value="">Select mode of arrival</option>
            <option value="car">Car</option>
            <option value="bus">Bus</option>
            <option value="train">Train</option>
            <option value="plane">Plane</option>
            <option value="walking">Walking</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Purpose of Stay</label>
          <select
            value={formData.purposeOfStay}
            onChange={(e) => handleInputChange('purposeOfStay', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
          >
            <option value="">Select purpose</option>
            <option value="business">Business</option>
            <option value="leisure">Leisure</option>
            <option value="conference">Conference</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests</label>
        <textarea
          value={formData.specialRequests}
          onChange={(e) => handleInputChange('specialRequests', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
          rows="3"
          placeholder="Enter any special requests"
        />
      </div>
    </div>
  )

  const renderRoomSelection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Room Type</label>
          <select
            value={formData.roomType}
            onChange={(e) => handleInputChange('roomType', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
          >
            <option value="">Select room type</option>
            {roomTypes.map(type => (
              <option key={type.id} value={type.name}>{type.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Rooms</label>
          <input
            type="number"
            value={formData.numberOfRooms}
            onChange={(e) => handleInputChange('numberOfRooms', parseInt(e.target.value) || 1)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
            min="1"
          />
        </div>
      </div>

      {availableRooms.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Available Rooms</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableRooms
              .filter(room => !formData.roomType || room.type === formData.roomType)
              .slice(0, 6)
              .map(room => (
                <div key={room.id} className="border border-gray-200 rounded-lg p-4 hover:border-[#2F5233] transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{room.number}</span>
                    <span className="text-sm text-gray-500">{room.type}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <div>Rate: ${room.rate}/night</div>
                    <div>Max Adults: {room.maxAdults}, Children: {room.maxChildren}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const selected = formData.selectedRooms.includes(room.id)
                        ? formData.selectedRooms.filter(id => id !== room.id)
                        : [...formData.selectedRooms, room.id]
                      handleInputChange('selectedRooms', selected)
                    }}
                    className={`w-full py-2 px-4 rounded-lg text-sm font-medium ${
                      formData.selectedRooms.includes(room.id)
                        ? 'bg-[#2F5233] text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {formData.selectedRooms.includes(room.id) ? 'Selected' : 'Select'}
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderPaymentDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
          <select
            value={formData.paymentMethod}
            onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
          >
            <option value="">Select payment method</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="check">Check</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Advance Payment</label>
          <input
            type="number"
            value={formData.advancePayment}
            onChange={(e) => handleInputChange('advancePayment', parseFloat(e.target.value) || 0)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Discount Code</label>
          <input
            type="text"
            value={formData.discountCode}
            onChange={(e) => handleInputChange('discountCode', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
            placeholder="Enter discount code"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Room Rate</label>
          <input
            type="number"
            value={formData.roomRate}
            onChange={(e) => handleInputChange('roomRate', parseFloat(e.target.value) || 0)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
            min="0"
            step="0.01"
          />
        </div>
      </div>
    </div>
  )

  const renderConfirmation = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Guest:</strong> {formData.fullName}
          </div>
          <div>
            <strong>Email:</strong> {formData.email}
          </div>
          <div>
            <strong>Phone:</strong> {formData.phoneNumber}
          </div>
          <div>
            <strong>Check-in:</strong> {formData.checkInDate}
          </div>
          <div>
            <strong>Check-out:</strong> {formData.checkOutDate}
          </div>
          <div>
            <strong>Guests:</strong> {formData.adults} adults, {formData.children} children
          </div>
          <div>
            <strong>Room Type:</strong> {formData.roomType}
          </div>
          <div>
            <strong>Rooms:</strong> {formData.numberOfRooms}
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Send Confirmation</h4>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.sendConfirmation.email}
              onChange={(e) => handleInputChange('sendConfirmation', { ...formData.sendConfirmation, email: e.target.checked })}
              className="mr-2"
            />
            Email confirmation
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.sendConfirmation.sms}
              onChange={(e) => handleInputChange('sendConfirmation', { ...formData.sendConfirmation, sms: e.target.checked })}
              className="mr-2"
            />
            SMS confirmation
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.sendConfirmation.print}
              onChange={(e) => handleInputChange('sendConfirmation', { ...formData.sendConfirmation, print: e.target.checked })}
              className="mr-2"
            />
            Print confirmation
          </label>
        </div>
      </div>
    </div>
  )

  const StepIndicator = () => (
    <div className="flex justify-center mb-8">
      {[1, 2, 3, 4, 5].map(step => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step <= currentStep ? 'bg-[#2F5233] text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {step}
          </div>
          {step < 5 && (
            <div className={`w-12 h-1 mx-2 ${
              step < currentStep ? 'bg-[#2F5233]' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  )

  if (loading && !availableRooms.length) {
    return (
      <div className="min-h-screen bg-[#F8FFF4] py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2F5233] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FFF4] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1C1C1C] mb-2">
            {isEditing ? 'Edit Reservation' : 'Offline Reservation'}
          </h1>
          <p className="text-gray-600">
            Capture complete guest details with nationality and ID information
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <StepIndicator />
        <div className="mb-8">
          {renderCurrentStep()}
        </div>

        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              currentStep === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white text-[#2F5233] border border-[#2F5233] hover:bg-[#F8FFF4]'
            }`}
          >
            Previous
          </button>
          {currentStep < 5 ? (
            <div className="flex gap-2">
              {isEditing && (
                <button
                  onClick={handleCancelBooking}
                  disabled={loading}
                  className="px-6 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Cancel Booking'}
                </button>
              )}
              <button
                onClick={nextStep}
                disabled={loading}
                className="px-6 py-3 bg-[#2F5233] text-white rounded-lg font-medium hover:bg-[#1f3625] transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Next Step'}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              {isEditing && (
                <button
                  onClick={handleDeleteBooking}
                  disabled={loading}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Delete'}
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-[#FFD670] text-[#1C1C1C] rounded-lg font-bold hover:bg-[#ffd04d] transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : (isEditing ? 'Save Changes' : 'Submit Reservation')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OfflineReservation
