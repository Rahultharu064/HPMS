import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Star, Users, Wifi, Car, Coffee, Dumbbell, Heart, 
  Calendar, ChevronLeft, ChevronRight, Play, X, 
  Bed, Square, Clock, Shield, CreditCard, ArrowLeft,
  ChevronDown, Plus, Minus
} from 'lucide-react'
import Header from '../../components/publicwebsite/Layout/Header'
import Footer from '../../components/publicwebsite/Layout/Footer'
import { roomService } from '../../services/roomService'
import { bookingService } from '../../services/bookingService'
import { buildMediaUrl } from '../../utils/media'

const RoomDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [similarRooms, setSimilarRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reviews, setReviews] = useState([])
  const [reviewsSummary, setReviewsSummary] = useState({ ratingAvg: 0, ratingCount: 0 })
  const [reviewForm, setReviewForm] = useState({ name: '', rating: "", comment: '' })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState(null)
  
  // Image gallery state
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showLightbox, setShowLightbox] = useState(false)
  
  // Video state
  const [showVideo, setShowVideo] = useState(false)
  
  // Booking state
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    adults: 2,
    children: 0,
    nights: 1
  })
  
  // Price calculation
  const [priceBreakdown, setPriceBreakdown] = useState({
    basePrice: 0,
    taxes: 0,
    total: 0
  })

  // Guest + booking submission state
  const [guestData, setGuestData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    paymentMethod: 'Cash'
  })
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState(null)

  // Fetch room details and similar rooms
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [roomResponse, similarResponse, reviewsResponse] = await Promise.all([
          roomService.getRoomById(id),
          roomService.getSimilarRooms(id),
          roomService.getRoomReviews(id)
        ])
        
        setRoom(roomResponse.room)
        setSimilarRooms(similarResponse.data || [])
        setReviews(reviewsResponse.data || [])
        setReviewsSummary({
          ratingAvg: Number(reviewsResponse.ratingAvg || 0),
          ratingCount: Number(reviewsResponse.ratingCount || 0)
        })
        
        // Calculate initial price breakdown
        if (roomResponse.room) {
          calculatePriceBreakdown(roomResponse.room.price, 1)
        }
      } catch (err) {
        console.error('Error fetching room data:', err)
        setError(err.message || 'Failed to fetch room details')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchRoomData()
    }
  }, [id])

  const handleReviewChange = (field, value) => {
    setReviewForm(prev => ({ ...prev, [field]: value }))
  }

  const submitReview = async () => {
    try {
      setReviewSubmitting(true)
      setReviewError(null)
      if (!reviewForm.name || !reviewForm.comment || !reviewForm.rating) {
        throw new Error('Please fill all fields')
      }
      await roomService.addRoomReview(id, {
        name: reviewForm.name,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment
      })
      const refreshed = await roomService.getRoomReviews(id)
      setReviews(refreshed.data || [])
      setReviewsSummary({
        ratingAvg: Number(refreshed.ratingAvg || 0),
        ratingCount: Number(refreshed.ratingCount || 0)
      })
      setReviewForm({ name: '', rating: 5, comment: '' })
    } catch (e) {
      setReviewError(e.message || 'Failed to submit review')
    } finally {
      setReviewSubmitting(false)
    }
  }

  // Calculate price breakdown
  const calculatePriceBreakdown = (basePrice, nights) => {
    const subtotal = basePrice * nights
    const taxes = subtotal * 0.13 // 13% tax
    const total = subtotal + taxes
    
    setPriceBreakdown({
      basePrice: subtotal,
      taxes: taxes,
      total: total
    })
  }

  // Handle booking data changes
  const handleBookingChange = (field, value) => {
    const newBookingData = { ...bookingData, [field]: value }
    setBookingData(newBookingData)
    
    // Calculate nights if both dates are selected
    if (field === 'checkOut' && newBookingData.checkIn && newBookingData.checkOut) {
      const checkInDate = new Date(newBookingData.checkIn)
      const checkOutDate = new Date(newBookingData.checkOut)
      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))
      newBookingData.nights = nights
      
      if (room) {
        calculatePriceBreakdown(room.price, nights)
      }
    }
  }

  const handleGuestChange = (field, value) => {
    setGuestData(prev => ({ ...prev, [field]: value }))
  }

  const submitBooking = async () => {
    try {
      setSubmitting(true)
      setBookingError(null)

      if (!room) throw new Error('Room not loaded')
      if (!bookingData.checkIn || !bookingData.checkOut) throw new Error('Please select check-in and check-out dates')
      const checkInDate = new Date(bookingData.checkIn)
      const checkOutDate = new Date(bookingData.checkOut)
      if (!(checkOutDate > checkInDate)) throw new Error('Check-out must be after check-in')

      const payload = {
        roomId: room.id,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        adults: bookingData.adults,
        children: bookingData.children,
        firstName: guestData.firstName,
        lastName: guestData.lastName,
        email: guestData.email,
        phone: guestData.phone,
        paymentMethod: guestData.paymentMethod || 'Cash'
      }

      await bookingService.createBooking(payload)
      // Optionally navigate or show confirmation
      // navigate(`/booking/${res.booking.id}`)
      setShowBookingModal(false)
    } catch (err) {
      setBookingError(err.message || 'Failed to create booking')
    } finally {
      setSubmitting(false)
    }
  }

  // Get amenity icon
  const getAmenityIcon = (amenity) => {
    const icons = {
      'Free WiFi': Wifi,
      'Parking': Car,
      'Breakfast': Coffee,
      'Gym': Dumbbell,
      'Spa': Heart,
      'Room Service': Clock,
      'Security': Shield,
      'Air Conditioning': Square
    }
    return icons[amenity] || Coffee
  }

  // Get room image
  const getRoomImage = (image) => {
    if (image && image.url) {
      return buildMediaUrl(image.url)
    }
    return 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
  }

  // Get room amenities
  const getRoomAmenities = (room) => {
    if (room && room.amenity && room.amenity.length > 0) {
      return room.amenity.map(a => a.name)
    }
    return ['Free WiFi', 'Parking', 'Breakfast']
  }

  // Navigation functions
  const nextImage = () => {
    if (room && room.image) {
      setCurrentImageIndex((prev) => (prev + 1) % room.image.length)
    }
  }

  const prevImage = () => {
    if (room && room.image) {
      setCurrentImageIndex((prev) => (prev - 1 + room.image.length) % room.image.length)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading room details...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || 'Room not found'}</p>
            <button 
              onClick={() => navigate('/rooms')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Rooms
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const amenities = getRoomAmenities(room)
  const images = room.image || []
  const videos = room.video || []

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Back Button */}
      <div className="pt-24 pb-4 bg-gray-50">
        <div className="container mx-auto px-4">
          <button 
            onClick={() => navigate('/rooms')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Rooms
          </button>
        </div>
      </div>

      <main className="pb-20">
        <div className="container mx-auto px-4">
          {/* Room Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{room.name}</h1>
                <div className="flex items-center gap-4 text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="fill-yellow-400 text-yellow-400" size={20} />
                    <span className="font-semibold">{reviewsSummary.ratingCount > 0 ? reviewsSummary.ratingAvg.toFixed(1) : '0.0'}</span>
                    <span>({reviewsSummary.ratingCount} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={20} />
                    <span>{room.maxAdults} Adults</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Square size={20} />
                    <span>{room.size} sqm</span>
                  </div>
                </div>
                <p className="text-lg text-gray-600">{room.description}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">₹{room.price.toLocaleString()}</div>
                <div className="text-gray-500">per night</div>
                <div className="mt-3">
                  <button onClick={() => navigate(`/rooms/${room.id}/book`)} className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Image Gallery */}
          <div className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Main Image */}
              <div className="lg:col-span-2">
                <div className="relative rounded-2xl overflow-hidden">
                  <img 
                    src={getRoomImage(images[currentImageIndex])} 
                    alt={room.name}
                    className="w-full h-96 lg:h-[500px] object-cover cursor-pointer"
                    onClick={() => setShowLightbox(true)}
                  />
                  
                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button 
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button 
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                  
                  {/* Image Counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  )}
                </div>
              </div>

              {/* Thumbnail Grid */}
              <div className="grid grid-cols-2 gap-2">
                {images.slice(0, 4).map((image, index) => (
                  <div 
                    key={index}
                    className={`relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                      index === currentImageIndex ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img 
                      src={getRoomImage(image)} 
                      alt={`${room.name} ${index + 1}`}
                      className="w-full h-24 object-cover"
                    />
                    {index === 3 && images.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold">
                        +{images.length - 4}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Video Tour */}
          {videos.length > 0 && (
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Room Video Tour</h3>
              <div className="relative rounded-2xl overflow-hidden">
                <img 
                  src={getRoomImage(images[0])} 
                  alt="Video thumbnail"
                  className="w-full h-64 lg:h-96 object-cover"
                />
                <button 
                  onClick={() => setShowVideo(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                >
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                    <Play className="text-blue-600 ml-1" size={24} />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Room Details & Amenities */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
            {/* Room Details */}
            <div className="lg:col-span-2">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Room Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-center gap-3">
                  <Bed className="text-blue-600" size={24} />
                  <div>
                    <div className="font-semibold text-gray-900">Bed Type</div>
                    <div className="text-gray-600">{room.numBeds} {room.numBeds > 1 ? 'Beds' : 'Bed'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="text-blue-600" size={24} />
                  <div>
                    <div className="font-semibold text-gray-900">Capacity</div>
                    <div className="text-gray-600">{room.maxAdults} Adults, {room.maxChildren} Children</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Square className="text-blue-600" size={24} />
                  <div>
                    <div className="font-semibold text-gray-900">Room Size</div>
                    <div className="text-gray-600">{room.size} sqm</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="text-blue-600" size={24} />
                  <div>
                    <div className="font-semibold text-gray-900">Floor</div>
                    <div className="text-gray-600">Floor {room.floor}</div>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">Amenities</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {amenities.map((amenity, index) => {
                    const IconComponent = getAmenityIcon(amenity)
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <IconComponent className="text-blue-600" size={20} />
                        <span className="text-gray-700">{amenity}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Price Breakdown</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Rate ({bookingData.nights} night{bookingData.nights > 1 ? 's' : ''})</span>
                  <span className="font-semibold">₹{priceBreakdown.basePrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxes & Fees (13%)</span>
                  <span className="font-semibold">₹{priceBreakdown.taxes.toLocaleString()}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">₹{priceBreakdown.total.toLocaleString()}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-500 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="text-green-600" size={16} />
                    <span>Free cancellation until 24 hours before check-in</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="text-green-600" size={16} />
                    <span>Pay at property</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Availability Calendar */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Check Availability</h3>
            <div className="bg-white border rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Check-in Date</label>
                  <input
                    type="date"
                    value={bookingData.checkIn}
                    onChange={(e) => handleBookingChange('checkIn', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Check-out Date</label>
                  <input
                    type="date"
                    value={bookingData.checkOut}
                    onChange={(e) => handleBookingChange('checkOut', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Guest Reviews</h3>
            {reviewsSummary.ratingCount > 0 && (
              <div className="flex items-center gap-3 mb-6">
                <Star className="fill-yellow-400 text-yellow-400" size={24} />
                <div className="text-lg font-semibold">{reviewsSummary.ratingAvg.toFixed(1)} out of 5</div>
                <div className="text-gray-600">({reviewsSummary.ratingCount} reviews)</div>
              </div>
            )}
            <div className="space-y-4 mb-8">
              {reviews.length === 0 && (
                <div className="text-gray-600">No reviews yet. Be the first to review this room.</div>
              )}
              {reviews.map(r => (
                <div key={r.id} className="bg-white border rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900">{r.name}</div>
                    <div className="flex items-center gap-2">
                      <Star className="fill-yellow-400 text-yellow-400" size={18} />
                      <span className="font-medium">{r.rating}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-gray-700 leading-relaxed">{r.comment}</div>
                  <div className="mt-1 text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="text-xl font-bold text-gray-900 mb-4">Write a Review</h4>
              {reviewError && <div className="mb-3 text-sm text-red-600">{reviewError}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
                  <input value={reviewForm.name} onChange={(e) => handleReviewChange('name', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={reviewForm.rating}
                    onChange={(e) => handleReviewChange('rating', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Comment</label>
                  <textarea value={reviewForm.comment} onChange={(e) => handleReviewChange('comment', e.target.value)} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={submitReview} disabled={reviewSubmitting} className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>

          {/* Similar Rooms */}
          {similarRooms.length > 0 && (
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Similar Rooms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {similarRooms.map((similarRoom) => (
                  <div key={similarRoom.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                    <img 
                      src={getRoomImage(similarRoom.image?.[0])} 
                      alt={similarRoom.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h4 className="font-bold text-gray-900 mb-2">{similarRoom.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Users size={16} />
                        <span>{similarRoom.maxAdults} Guests</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-blue-600">₹{similarRoom.price.toLocaleString()}</span>
                        <button 
                          onClick={() => navigate(`/rooms/${similarRoom.id}`)}
                          className="text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Booking Card */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-2xl font-bold text-blue-600">₹{room.price.toLocaleString()}</div>
                <div className="text-sm text-gray-500">per night</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-gray-600" />
                  <span className="text-sm text-gray-600">
                    {bookingData.checkIn ? new Date(bookingData.checkIn).toLocaleDateString() : 'Check-in'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-gray-600" />
                  <span className="text-sm text-gray-600">
                    {bookingData.adults} Adults, {bookingData.children} Children
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleBookingChange('adults', Math.max(1, bookingData.adults - 1))}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center">{bookingData.adults}</span>
                <button 
                  onClick={() => handleBookingChange('adults', bookingData.adults + 1)}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  <Plus size={16} />
                </button>
              </div>
              <button onClick={() => navigate(`/rooms/${room.id}/book`)} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105">
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 relative">
            <button onClick={() => setShowBookingModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Complete your booking</h3>

            {bookingError && (
              <div className="mb-4 text-sm text-red-600">{bookingError}</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                <input value={guestData.firstName} onChange={(e) => handleGuestChange('firstName', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                <input value={guestData.lastName} onChange={(e) => handleGuestChange('lastName', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input type="email" value={guestData.email} onChange={(e) => handleGuestChange('email', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                <input value={guestData.phone} onChange={(e) => handleGuestChange('phone', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
                <select value={guestData.paymentMethod} onChange={(e) => handleGuestChange('paymentMethod', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Online">Online</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowBookingModal(false)} className="px-4 py-2 rounded-lg border border-gray-300">Cancel</button>
              <button onClick={submitBooking} disabled={submitting} className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                {submitting ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {showLightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button 
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X size={32} />
          </button>
          <div className="relative max-w-4xl max-h-full">
            <img 
              src={getRoomImage(images[currentImageIndex])} 
              alt={room.name}
              className="max-w-full max-h-full object-contain"
            />
            {images.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideo && videos.length > 0 && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button 
            onClick={() => setShowVideo(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X size={32} />
          </button>
          <div className="relative max-w-4xl max-h-full">
            <video 
              controls 
              className="max-w-full max-h-full"
              poster={getRoomImage(images[0])}
            >
              <source src={buildMediaUrl(videos[0]?.url || '')} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default RoomDetail
