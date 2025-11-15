import React, { useState, useCallback, useEffect } from 'react'
import { Calendar, Clock, Users, MapPin, CreditCard, CheckCircle, Upload, Phone, Mail, User as UserIcon, Car, Plane, Home as HomeIcon } from 'lucide-react'
import { bookingService } from '../../../services/bookingService'
import { roomService } from '../../../services/roomService'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const OfflineReservation = () => {
  const [searchParams] = useSearchParams()
  const bookingIdParam = searchParams.get('id')
  const isEditing = Boolean(bookingIdParam)
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationality: '',
    idType: '',
    idNumber: '',
    roomId: '',
    checkIn: '',
    checkOut: '',
    adults: 1,
    children: 0,
    specialRequests: ''
  })

  const [availableRooms, setAvailableRooms] = useState([])
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
          setFormData(prev => ({
            ...prev,
            firstName: b.guest?.firstName || '',
            lastName: b.guest?.lastName || '',
            email: b.guest?.email || '',
            phone: b.guest?.phone || '',
            nationality: b.guest?.nationality || '',
            idType: b.guest?.idType || '',
            idNumber: b.guest?.idNumber || '',
            roomId: b.roomId || '',
            checkIn: b.checkIn ? new Date(b.checkIn).toISOString().split('T')[0] : '',
            checkOut: b.checkOut ? new Date(b.checkOut).toISOString().split('T')[0] : '',
            adults: b.adults || 1,
            children: b.children || 0,
            specialRequests: b.specialRequests || ''
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
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep])

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])



  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      // Send flat data without nested guest object
      const bookingData = { ...formData }

      let res
      if (isEditing) {
        res = await bookingService.updateBooking(bookingIdParam, bookingData)
      } else {
        res = await bookingService.createBooking(bookingData)
      }

      if (res?.success) {
        toast.success(isEditing ? 'Booking updated successfully!' : 'Booking created successfully!')
        setSuccess(isEditing ? 'Booking updated successfully!' : 'Booking created successfully!')
        if (!isEditing) {
          // Reset form for new booking
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            nationality: '',
            idType: '',
            idNumber: '',
            roomId: '',
            checkIn: '',
            checkOut: '',
            adults: 1,
            children: 0,
            specialRequests: ''
          })
          setCurrentStep(1)
        }
      } else {
        toast.error(res?.error || 'Failed to save booking')
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
        toast.success('Booking cancelled successfully')
        setSuccess('Booking cancelled successfully')
        setFormData(prev => ({ ...prev, bookingStatus: 'cancelled' }))
      } else {
        toast.error(res?.error || 'Failed to cancel booking')
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
        toast.success('Booking deleted successfully')
        setSuccess('Booking deleted successfully')
        // Redirect or reset form
      } else {
        toast.error(res?.error || 'Failed to delete booking')
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
        return renderConfirmation()
      default:
        return renderGuestDetails()
    }
  }

  const renderGuestDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
            placeholder="Enter first name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
            placeholder="Enter last name"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
            placeholder="Enter phone number"
            required
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
          <label className="block text-sm font-medium text-gray-700 mb-2">ID Type *</label>
          <select
            value={formData.idType}
            onChange={(e) => handleInputChange('idType', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
            required
          >
            <option value="">Select ID type</option>
            <option value="Passport">Passport</option>
            <option value="National ID">National ID</option>
            <option value="Driver License">Driver License</option>
            <option value="Voter ID">Voter ID</option>
            <option value="Citizenship">Citizenship</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ID Number *</label>
          <input
            type="text"
            value={formData.idNumber}
            onChange={(e) => handleInputChange('idNumber', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
            placeholder="Enter ID number"
            required
          />
        </div>
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
            value={formData.checkIn}
            onChange={(e) => handleInputChange('checkIn', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Check-out Date *</label>
          <input
            type="date"
            value={formData.checkOut}
            onChange={(e) => handleInputChange('checkOut', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5233] focus:border-transparent"
            required
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
      {availableRooms.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Select Room *</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableRooms.slice(0, 12).map(room => (
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
                  onClick={() => handleInputChange('roomId', room.id)}
                  className={`w-full py-2 px-4 rounded-lg text-sm font-medium ${
                    formData.roomId === room.id
                      ? 'bg-[#2F5233] text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {formData.roomId === room.id ? 'Selected' : 'Select'}
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
            <strong>Guest:</strong> {formData.firstName} {formData.lastName}
          </div>
          <div>
            <strong>Email:</strong> {formData.email}
          </div>
          <div>
            <strong>Phone:</strong> {formData.phone}
          </div>
          <div>
            <strong>Nationality:</strong> {formData.nationality || 'Not specified'}
          </div>
          <div>
            <strong>ID Type:</strong> {formData.idType}
          </div>
          <div>
            <strong>ID Number:</strong> {formData.idNumber}
          </div>
          <div>
            <strong>Check-in:</strong> {formData.checkIn}
          </div>
          <div>
            <strong>Check-out:</strong> {formData.checkOut}
          </div>
          <div>
            <strong>Guests:</strong> {formData.adults} adults, {formData.children} children
          </div>
          <div>
            <strong>Room:</strong> {availableRooms.find(r => r.id === formData.roomId)?.number || 'Not selected'}
          </div>
          <div>
            <strong>Special Requests:</strong> {formData.specialRequests || 'None'}
          </div>
        </div>
      </div>
    </div>
  )

  const StepIndicator = () => (
    <div className="flex justify-center mb-8">
      {[1, 2, 3, 4].map(step => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step <= currentStep ? 'bg-[#2F5233] text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {step}
          </div>
          {step < 4 && (
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
          {currentStep < 4 ? (
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
