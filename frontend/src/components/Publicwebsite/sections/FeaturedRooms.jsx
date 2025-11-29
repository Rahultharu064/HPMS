import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star, Users, Wifi, Car, Coffee, Dumbbell, ArrowRight, Heart, Loader2, Sparkles, ChevronRight } from 'lucide-react'
import { roomService } from '../../../services/roomService'

const FeaturedRooms = () => {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hoveredCard, setHoveredCard] = useState(null)

  useEffect(() => {
    const fetchFeaturedRooms = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await roomService.getFeaturedRooms()
        setRooms(response.data || [])
      } catch (err) {
        console.error('Error fetching featured rooms:', err)
        setError(err.message || 'Failed to fetch featured rooms')
        setRooms([
          {
            id: 1,
            name: 'Deluxe Suite',
            price: 8500,
            image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
            rating: 4.8,
            maxAdults: 2,
            size: 45,
            amenity: [{ name: 'Free WiFi' }, { name: 'Parking' }, { name: 'Breakfast' }, { name: 'Gym' }]
          },
          {
            id: 2,
            name: 'Presidential Suite',
            price: 15000,
            image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
            rating: 4.9,
            maxAdults: 4,
            size: 85,
            amenity: [{ name: 'Free WiFi' }, { name: 'Parking' }, { name: 'Breakfast' }, { name: 'Gym' }, { name: 'Spa' }]
          },
          {
            id: 3,
            name: 'Executive Room',
            price: 12000,
            image: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
            rating: 4.7,
            maxAdults: 3,
            size: 65,
            amenity: [{ name: 'Free WiFi' }, { name: 'Parking' }, { name: 'Breakfast' }, { name: 'Gym' }]
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedRooms()
  }, [])

  const getAmenityIcon = (amenity) => {
    const icons = {
      'Free WiFi': Wifi,
      'Parking': Car,
      'Breakfast': Coffee,
      'Gym': Dumbbell,
      'Spa': Heart
    }
    return icons[amenity] || Coffee
  }

  const getRoomImage = (room) => {
    const placeholder = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
    const val = room?.image

    if (typeof val === 'string' && val) {
      return val.startsWith('http') ? val : `${import.meta.env.VITE_API_BASE_URL}/${val}`
    }

    if (val && typeof val === 'object' && !Array.isArray(val) && typeof val.url === 'string') {
      return val.url.startsWith('http') ? val.url : `http://localhost:5000/${val.url}`
    }

    if (Array.isArray(val) && val.length > 0) {
      const first = val[0]
      if (typeof first === 'string') {
        return first.startsWith('http') ? first : `http://localhost:5000/${first}`
      }
      if (first && typeof first.url === 'string') {
        return first.url.startsWith('http') ? first.url : `http://localhost:5000/${first.url}`
      }
    }

    return placeholder
  }

  const getRoomAmenities = (room) => {
    const val = room?.amenity || room?.amenities
    if (Array.isArray(val) && val.length > 0) {
      return val.map((a) => (typeof a === 'string' ? a : a?.name)).filter(Boolean)
    }
    return ['Free WiFi', 'Parking', 'Breakfast']
  }

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      {/* Floating Gradient Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-delayed"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full px-6 py-3 mb-6 shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <Sparkles className="animate-pulse" size={18} />
            <span className="font-bold text-sm tracking-wide">FEATURED COLLECTION</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
            Luxury Accommodations
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Experience comfort and elegance in our carefully designed rooms and suites,
            each offering unique amenities and breathtaking views.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <Loader2 className="animate-spin text-blue-600" size={48} />
              <div className="absolute inset-0 animate-ping">
                <Loader2 className="text-blue-400 opacity-20" size={48} />
              </div>
            </div>
            <span className="mt-6 text-gray-600 text-lg font-medium">Discovering luxury rooms...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12 animate-fade-in">
            <div className="inline-block bg-red-50 border border-red-200 rounded-2xl px-8 py-6">
              <p className="text-red-600 font-semibold mb-2">{error}</p>
              <p className="text-gray-600">Showing sample rooms instead</p>
            </div>
          </div>
        )}

        {/* Rooms Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {rooms.map((room, index) => {
              const amenities = getRoomAmenities(room)
              const isHovered = hoveredCard === room.id

              return (
                <div
                  key={room.id}
                  className="group relative animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onMouseEnter={() => setHoveredCard(room.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Glow Effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500"></div>

                  <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-3">
                    {/* Image Container */}
                    <div className="relative overflow-hidden h-72">
                      <img
                        src={getRoomImage(room)}
                        alt={room.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />

                      {/* Overlay Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                      {/* Floating Badge */}
                      <div className="absolute top-4 left-4 transform -translate-y-20 group-hover:translate-y-0 transition-transform duration-500">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                          <Star className="fill-current" size={14} />
                          {room.name || room.roomType || 'ROOM'}
                        </div>
                      </div>

                      {/* Heart Button */}
                      <div className="absolute top-4 right-4">
                        <button className="p-3 bg-white/90 backdrop-blur-md rounded-full hover:bg-white hover:scale-110 transition-all duration-300 shadow-lg group/heart">
                          <Heart size={20} className="text-gray-600 group-hover/heart:text-red-500 group-hover/heart:fill-red-500 transition-all" />
                        </button>
                      </div>

                      {/* Rating Badge */}
                      <div className="absolute bottom-4 left-4 transform translate-y-20 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-full px-4 py-2 shadow-lg">
                          <Star className="fill-yellow-400 text-yellow-400" size={16} />
                          <span className="text-sm font-bold text-gray-900">
                            {typeof room?.ratingAvg === 'number' ? room.ratingAvg.toFixed(1) : '0.0'}
                          </span>
                          <span className="text-xs text-gray-500">({room?.ratingCount ?? 0})</span>
                        </div>
                      </div>

                      {/* Quick View on Hover */}
                      <div className="absolute inset-x-4 bottom-4 transform translate-y-20 group-hover:translate-y-0 transition-transform duration-500 delay-100 opacity-0 group-hover:opacity-100">
                        <Link
                          to={`/rooms/${room.id}`}
                          className="block w-full bg-white text-gray-900 text-center py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors shadow-lg"
                        >
                          Quick View
                        </Link>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Title and Price */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                            {room.name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <Users size={16} className="text-blue-600" />
                              <span className="font-medium">{room.maxAdults} Guests</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                              <span className="font-medium">{room.size} sqm</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            NPR{(typeof room?.price === 'number' ? room.price.toLocaleString() : room?.price || '—')}
                          </p>
                          <p className="text-xs text-gray-500 font-medium">per night</p>
                        </div>
                      </div>

                      {/* Amenities */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {amenities.slice(0, 3).map((amenity, idx) => {
                          const IconComponent = getAmenityIcon(amenity)
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-purple-50 text-gray-700 hover:text-blue-700 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 border border-gray-200 hover:border-blue-300"
                            >
                              <IconComponent size={14} />
                              <span>{amenity}</span>
                            </div>
                          )
                        })}
                        {amenities.length > 3 && (
                          <div className="flex items-center gap-1 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 px-3 py-2 rounded-xl text-sm font-medium border border-blue-200">
                            <Sparkles size={14} />
                            <span>+{amenities.length - 3} more</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Link
                          to={`/rooms/${room.id}`}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-3.5 rounded-xl font-semibold hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2 group/btn"
                        >
                          View Details
                          <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                          to={`/rooms/${room.id}/book`}
                          className="px-6 py-3.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-900 hover:text-white transition-all font-semibold hover:scale-105"
                        >
                          Book
                        </Link>
                      </div>
                    </div>

                    {/* Animated Border */}
                    <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-blue-200 transition-all duration-500 pointer-events-none"></div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <Link
            to="/rooms"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105 group relative overflow-hidden"
          >
            <span className="relative z-10">Explore All Rooms</span>
            <ArrowRight size={22} className="relative z-10 group-hover:translate-x-2 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
    </section>
  )
}

export default FeaturedRooms
