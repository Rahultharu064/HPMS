import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Star, Users, Wifi, Car, Coffee, Dumbbell, Heart,
  Calendar, ChevronLeft, ChevronRight, Play, X,
  Bed, Square, Clock, Shield, CreditCard, ArrowLeft,
  ChevronDown, Plus, Minus, Sparkles, MapPin, Award, CheckCircle
} from 'lucide-react'
import Header from '../../components/Publicwebsite/Layout/Header'
import Footer from '../../components/Publicwebsite/Layout/Footer'
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
  const [reviewForm, setReviewForm] = useState({ name: '', rating: '', comment: '' })
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
    const total = subtotal

    setPriceBreakdown({
      basePrice: subtotal,
      taxes: 0,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header />

      {/* Back Button */}
      <div className="pt-32 pb-8">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate('/rooms')}
            className="flex items-center gap-3 bg-white/80 backdrop-blur-xl px-6 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold text-gray-700 hover:text-blue-600"
          >
            <ArrowLeft size={20} />
            Back to Luxury Rooms
          </button>
        </div>
      </div>

      <main className="pb-20">
        <div className="container mx-auto px-4">
          {/* Room Header */}
          <div className="mb-12">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-bold text-lg tracking-wide">
                      <Sparkles className="animate-pulse" size={20} />
                      {room.name || room.roomType || 'Luxury Room'}
                      <Sparkles className="animate-pulse" size={20} />
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full font-semibold text-sm">
                      <CheckCircle size={16} className="inline mr-2" />
                      Available Now
                    </div>
                  </div>

                  <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">{room.name}</h1>

                  {/* Key Stats Row */}
                  <div className="flex flex-wrap items-center gap-6 mb-8">
                    <div className="flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-3 rounded-2xl shadow-lg">
                      <Star className="fill-white text-white animate-pulse" size={20} />
                      <span className="font-bold text-lg">{reviewsSummary.ratingCount > 0 ? reviewsSummary.ratingAvg.toFixed(1) : '0.0'}</span>
                      <span className="text-white/90">({reviewsSummary.ratingCount} reviews)</span>
                    </div>

                    <div className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-2xl shadow-lg">
                      <Users size={20} />
                      <span className="font-bold">{room.maxAdults} Adults</span>
                    </div>

                    <div className="flex items-center gap-3 bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-2xl shadow-lg">
                      <Square size={20} />
                      <span className="font-bold">{room.size} sqm</span>
                    </div>

                    <div className="flex items-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl shadow-lg">
                      <Bed size={20} />
                      <span className="font-bold">{room.numBeds} {room.numBeds > 1 ? 'Beds' : 'Bed'}</span>
                    </div>
                  </div>

                  <p className="text-xl text-gray-700 leading-relaxed mb-8 max-w-3xl">{room.description}</p>

                  {/* Additional Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg border border-blue-200">
                      <div className="text-sm text-blue-600 font-semibold mb-2">Floor Level</div>
                      <div className="text-2xl font-black text-blue-800">{room.floor}</div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg border border-purple-200">
                      <div className="text-sm text-purple-600 font-semibold mb-2">Max Children</div>
                      <div className="text-2xl font-black text-purple-800">{room.maxChildren}</div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg border border-green-200">
                      <div className="text-sm text-green-600 font-semibold mb-2">Room Category</div>
                      <div className="text-lg font-bold text-green-800">{room.type || 'Premium'}</div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl shadow-lg border border-emerald-200">
                      <div className="text-sm text-emerald-600 font-semibold mb-2">Availability</div>
                      <div className="text-lg font-bold text-emerald-800">✓ Ready</div>
                    </div>
                  </div>
                </div>

                {/* Price Card */}
                <div className="lg:min-w-[320px]">
                  <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-4 right-4 w-20 h-20 bg-white rounded-full"></div>
                      <div className="absolute bottom-4 left-4 w-16 h-16 bg-white rounded-full"></div>
                    </div>

                    <div className="relative z-10">
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
                          <Award className="text-yellow-300" size={16} />
                          <span className="text-sm font-semibold">Best Price Guaranteed</span>
                        </div>
                        <div className="text-4xl font-black mb-2">NPR{room.price.toLocaleString()}</div>
                        <div className="text-blue-100 font-medium">per night</div>
                      </div>

                      <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                          <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-300" />
                            <span className="text-sm">Best rates</span>
                          </div>
                          <span className="font-bold">✓</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                          <div className="flex items-center gap-2">
                            <Shield size={16} className="text-green-300" />
                            <span className="text-sm">Free cancellation</span>
                          </div>
                          <span className="font-bold">24h</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-green-300" />
                            <span className="text-sm">Prime location</span>
                          </div>
                          <span className="font-bold">✓</span>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/rooms/${room.id}/book`)}
                        className="w-full bg-white text-blue-600 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl text-lg"
                      >
                        Book Your Stay
                      </button>

                      <div className="mt-4 text-center">
                        <p className="text-sm text-blue-100">✨ Instant confirmation</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Image Gallery */}
          <div className="mb-12">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Image */}
                <div className="lg:col-span-2">
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl group cursor-pointer hover:shadow-3xl transition-all duration-500" onClick={() => setShowLightbox(true)}>
                    <img
                      src={getRoomImage(images[currentImageIndex])}
                      alt={room.name}
                      className="w-full h-80 lg:h-96 object-cover group-hover:scale-105 transition-transform duration-700"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); prevImage(); }}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-lg rounded-full flex items-center justify-center text-gray-700 hover:bg-white hover:scale-110 transition-all duration-300 shadow-xl"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); nextImage(); }}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-lg rounded-full flex items-center justify-center text-gray-700 hover:bg-white hover:scale-110 transition-all duration-300 shadow-xl"
                        >
                          <ChevronRight size={24} />
                        </button>
                      </>
                    )}

                    {/* Image Counter */}
                    {images.length > 1 && (
                      <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-lg text-white px-4 py-2 rounded-full text-sm font-semibold shadow-xl">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    )}

                    {/* Click to View */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white/90 backdrop-blur-lg rounded-full px-6 py-3 shadow-xl">
                        <span className="text-gray-900 font-semibold">Click to enlarge</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thumbnail Grid */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                      <Heart className="text-white" size={20} />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">Room Gallery</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {images.slice(0, 4).map((image, index) => (
                      <div
                        key={index}
                        className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${index === currentImageIndex ? 'ring-4 ring-blue-500 shadow-xl' : 'shadow-lg'
                          }`}
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        <img
                          src={getRoomImage(image)}
                          alt={`${room.name} ${index + 1}`}
                          className="w-full h-24 object-cover"
                        />
                        {index === currentImageIndex && (
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 flex items-center justify-center backdrop-blur-sm">
                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                              <CheckCircle size={16} className="text-blue-600" />
                            </div>
                          </div>
                        )}
                        {index === 3 && images.length > 4 && (
                          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/60 flex items-center justify-center text-white font-bold text-xl backdrop-blur-sm">
                            +{images.length - 4}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Gallery Stats */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                    <div className="text-center mb-4">
                      <div className="text-3xl font-black text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">{images.length}</div>
                      <div className="text-sm text-gray-600 font-semibold">High-Res Photos</div>
                    </div>
                    {videos.length > 0 && (
                      <div className="pt-4 border-t border-blue-200">
                        <div className="text-center">
                          <div className="text-3xl font-black text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text">{videos.length}</div>
                          <div className="text-sm text-gray-600 font-semibold">Video Tour{videos.length > 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="mt-6 space-y-3">
                      <button
                        onClick={() => setShowLightbox(true)}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
                      >
                        View All Photos
                      </button>
                      {videos.length > 0 && (
                        <button
                          onClick={() => setShowVideo(true)}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
                        >
                          🎥 Watch Video Tour
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Video Tour */}
          {videos.length > 0 && (
            <div className="mb-12">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full font-bold text-lg mb-4">
                    <Sparkles className="animate-pulse" size={20} />
                    Virtual Room Tour
                    <Sparkles className="animate-pulse" size={20} />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 mb-4">Immersive Experience</h3>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto">Step inside our luxury accommodations with our interactive video tours</p>
                </div>

                <div className="relative rounded-3xl overflow-hidden shadow-2xl group max-w-5xl mx-auto hover:shadow-3xl transition-all duration-500">
                  <img
                    src={getRoomImage(images[0])}
                    alt="Video thumbnail"
                    className="w-full h-64 lg:h-80 object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                  <button
                    onClick={() => setShowVideo(true)}
                    className="absolute inset-0 flex items-center justify-center hover:bg-black/30 transition-all duration-300 group/btn"
                  >
                    <div className="w-20 h-20 bg-white/95 backdrop-blur-lg rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300">
                      <Play className="text-gray-900 ml-1 group-hover/btn:text-blue-600 transition-colors" size={32} />
                    </div>
                  </button>

                  <div className="absolute bottom-6 left-6 text-white">
                    <div className="text-2xl font-black mb-2">Watch Virtual Tour</div>
                    <div className="text-lg opacity-90 font-medium">Interactive 360° Experience</div>
                  </div>

                  <div className="absolute top-6 right-6 bg-black/70 backdrop-blur-lg text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl">
                    {videos.length} Video{videos.length > 1 ? 's' : ''} Available
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute top-6 left-6 flex gap-3">
                    <div className="bg-white/90 backdrop-blur-lg rounded-full px-4 py-2 shadow-xl">
                      <span className="text-gray-900 font-bold text-sm">HD Quality</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-5xl mx-auto">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <div className="text-4xl mb-4">🎥</div>
                    <div className="font-bold text-gray-900 text-lg mb-2">4K Ultra HD</div>
                    <div className="text-gray-600 font-medium">Crystal clear visuals</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg border border-purple-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <div className="text-4xl mb-4">🔄</div>
                    <div className="font-bold text-gray-900 text-lg mb-2">360° Interactive</div>
                    <div className="text-gray-600 font-medium">Explore every angle</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl shadow-lg border border-pink-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <div className="text-4xl mb-4">🎧</div>
                    <div className="font-bold text-gray-900 text-lg mb-2">Audio Narration</div>
                    <div className="text-gray-600 font-medium">Guided experience</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Room Details & Amenities */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Room Details */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Room Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Bed className="text-white" size={24} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Bed Configuration</div>
                      <div className="text-gray-600">{room.numBeds} {room.numBeds > 1 ? 'Beds' : 'Bed'} Available</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <Users className="text-white" size={24} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Guest Capacity</div>
                      <div className="text-gray-600">Up to {room.maxAdults} Adults, {room.maxChildren} Children</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <Square className="text-white" size={24} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Room Dimensions</div>
                      <div className="text-gray-600">{room.size} sqm of Space</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg">
                    <div className="p-2 bg-orange-500 rounded-lg">
                      <Clock className="text-white" size={24} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Location</div>
                      <div className="text-gray-600">Floor {room.floor} • Prime View</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h4 className="text-xl font-bold text-gray-900 mb-4">Amenities</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {amenities.map((amenity, index) => {
                    const IconComponent = getAmenityIcon(amenity)
                    return (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="p-1 bg-blue-500 rounded">
                          <IconComponent className="text-white" size={16} />
                        </div>
                        <span className="text-gray-800 font-medium">{amenity}</span>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-1">{amenities.length}+</div>
                    <div className="text-gray-600">Amenities Included</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Booking Summary</h3>
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-700">Room Rate</span>
                    <span className="font-semibold text-gray-900">NPR{room.price.toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-gray-500">per night</div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-700">Stay Duration</span>
                    <span className="font-semibold text-gray-900">{bookingData.nights} night{bookingData.nights > 1 ? 's' : ''}</span>
                  </div>
                  <div className="text-sm text-gray-500">Selected period</div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-700">Subtotal</span>
                    <span className="font-semibold text-gray-900">NPR{priceBreakdown.basePrice.toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-gray-500">Before taxes</div>
                </div>



                <div className="border-t border-gray-300 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xl font-bold text-gray-900">Total Amount</span>
                    <span className="text-2xl font-bold text-blue-600">NPR{priceBreakdown.total.toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-gray-500 text-center">All inclusive pricing</div>
                </div>

                <div className="space-y-3 pt-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Shield className="text-green-600" size={18} />
                    <div>
                      <div className="font-semibold text-green-800">Free Cancellation</div>
                      <div className="text-sm text-green-600">Up to 24 hours before check-in</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <CreditCard className="text-blue-600" size={18} />
                    <div>
                      <div className="font-semibold text-blue-800">Flexible Payment</div>
                      <div className="text-sm text-blue-600">Pay at property or online</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Availability Calendar */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan Your Stay</h3>
                <p className="text-gray-600">Select your preferred dates and check availability</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Calendar className="text-blue-600" size={20} />
                    Check-in Date
                  </label>
                  <input
                    type="date"
                    value={bookingData.checkIn}
                    onChange={(e) => handleBookingChange('checkIn', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <div className="text-sm text-gray-500 mt-2">Select your arrival date</div>
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Calendar className="text-green-600" size={20} />
                    Check-out Date
                  </label>
                  <input
                    type="date"
                    value={bookingData.checkOut}
                    onChange={(e) => handleBookingChange('checkOut', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                  <div className="text-sm text-gray-500 mt-2">Select your departure date</div>
                </div>
              </div>

              {/* Booking Summary Preview */}
              {bookingData.checkIn && bookingData.checkOut && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="text-center mb-4">
                    <div className="text-xl font-bold text-gray-900 mb-1">Booking Preview</div>
                    <div className="text-gray-600">Your selected dates</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-white rounded-lg">
                      <div className="text-lg font-bold text-blue-600 mb-1">{bookingData.nights}</div>
                      <div className="text-sm text-gray-600">Night{bookingData.nights > 1 ? 's' : ''}</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <div className="text-lg font-bold text-green-600 mb-1">{bookingData.adults + bookingData.children}</div>
                      <div className="text-sm text-gray-600">Guest{bookingData.adults + bookingData.children > 1 ? 's' : ''}</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <div className="text-xl font-bold text-blue-600 mb-1">NPR{(room.price * bookingData.nights).toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Estimated Total</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate(`/rooms/${room.id}/book`)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Guest Reviews</h3>
                <p className="text-gray-600">Real reviews from our valued guests</p>
              </div>

              {reviewsSummary.ratingCount > 0 && (
                <div className="flex items-center justify-center gap-4 mb-6 p-4 bg-yellow-50 rounded-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Star className="fill-yellow-400 text-yellow-400" size={24} />
                      <div className="text-2xl font-bold text-gray-900">{reviewsSummary.ratingAvg.toFixed(1)}</div>
                    </div>
                    <div className="text-gray-600">out of 5 stars</div>
                    <div className="text-sm text-gray-500 mt-1">Based on {reviewsSummary.ratingCount} review{reviewsSummary.ratingCount > 1 ? 's' : ''}</div>
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-6">
                {reviews.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <div className="text-4xl mb-2">💬</div>
                    <div className="text-lg font-semibold text-gray-900 mb-1">No reviews yet</div>
                    <div className="text-gray-600">Be the first to share your experience with this room!</div>
                  </div>
                )}
                {reviews.map(r => (
                  <div key={r.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{r.name}</div>
                          <div className="text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full">
                        <Star className="fill-yellow-400 text-yellow-400" size={16} />
                        <span className="font-semibold text-gray-900">{r.rating}</span>
                      </div>
                    </div>
                    <div className="text-gray-700 leading-relaxed">{r.comment}</div>
                  </div>
                ))}
              </div>

              {/* Write Review Section */}
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="text-center mb-4">
                  <h4 className="text-xl font-bold text-gray-900 mb-1">Share Your Experience</h4>
                  <p className="text-gray-600">Help other guests make the right choice</p>
                </div>

                {reviewError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {reviewError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Your Name</label>
                    <input
                      value={reviewForm.name}
                      onChange={(e) => handleReviewChange('name', e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Your Rating</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={5}
                        step={0.1}
                        value={reviewForm.rating}
                        onChange={(e) => handleReviewChange('rating', e.target.value)}
                        placeholder="Rate 1-5"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                      />
                      <Star className="absolute right-3 top-1/2 transform -translate-y-1/2 text-yellow-400" size={20} />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Your Review</label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) => handleReviewChange('comment', e.target.value)}
                      placeholder="Tell us about your experience..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
                    ></textarea>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <button
                    onClick={submitReview}
                    disabled={reviewSubmitting}
                    className="px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reviewSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </div>
                    ) : (
                      'Submit Review'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Similar Rooms */}
          {similarRooms.length > 0 && (
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">You Might Also Like</h3>
                  <p className="text-gray-600">Explore similar rooms that match your preferences</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {similarRooms.map(room => (
                    <div key={room.id} className="bg-gray-50 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/rooms/${room.id}`)}>
                      <div className="relative">
                        <img
                          src={getRoomImage(room.image?.[0])}
                          alt={room.name}
                          className="w-full h-40 object-cover"
                        />
                        <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
                          NPR{room.price.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{room.name}</h4>
                        <p className="text-gray-600 mb-3 line-clamp-2 text-sm">{room.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Star className="fill-yellow-400 text-yellow-400" size={14} />
                            <span className="text-sm text-gray-600">4.5 (12 reviews)</span>
                          </div>
                          <button className="px-3 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors text-sm">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>


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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-all duration-200 hover:scale-110 active:scale-95 z-60"
          >
            <X size={32} />
          </button>
          <div className="relative max-w-4xl max-h-full animate-in zoom-in-95 duration-500">
            <img
              src={getRoomImage(images[currentImageIndex])}
              alt={room.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 hover:scale-110 transition-all duration-200 shadow-lg"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 hover:scale-110 transition-all duration-200 shadow-lg"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}
            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                {currentImageIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideo && videos.length > 0 && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <button
            onClick={() => setShowVideo(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-all duration-200 hover:scale-110 active:scale-95 z-60"
          >
            <X size={32} />
          </button>
          <div className="relative max-w-4xl max-h-full animate-in zoom-in-95 duration-500">
            <video
              controls
              autoPlay
              className="max-w-full max-h-full rounded-lg shadow-2xl"
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
