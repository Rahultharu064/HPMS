import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star, Users, Wifi, Car, Coffee, Dumbbell, ArrowRight, Heart, Loader2 } from 'lucide-react'
import { roomService } from '../../../services/roomService'

const FeaturedRooms = () => {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch featured rooms from backend
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
        // Fallback to static data if API fails
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

  // Helper function to get room image
  const getRoomImage = (room) => {
    const placeholder = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
    const val = room?.image

    // String value
    if (typeof val === 'string' && val) {
      return val.startsWith('http') ? val : `${import.meta.env.VITE_API_BASE_URL}/${val}`
    }

    // Object with url
    if (val && typeof val === 'object' && !Array.isArray(val) && typeof val.url === 'string') {
      return val.url.startsWith('http') ? val.url : `http://localhost:5000/${val.url}`
    }

    // Array of strings or objects
    if (Array.isArray(val) && val.length > 0) {
      const first = val[0]
      if (typeof first === 'string') {
        return first.startsWith('http') ? first : `http://localhost:5000/${first}`
      }
      if (first && typeof first.url === 'string') {
        return first.url.startsWith('http') ? first.url : `http://localhost:5000/${first.url}`
      }
    }

    // Fallback to placeholder image
    return placeholder
  }

  // Helper function to get amenities
  const getRoomAmenities = (room) => {
    const val = room?.amenity || room?.amenities
    if (Array.isArray(val) && val.length > 0) {
      return val.map((a) => (typeof a === 'string' ? a : a?.name)).filter(Boolean)
    }
    return ['Free WiFi', 'Parking', 'Breakfast']
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 rounded-full px-4 py-2 mb-4">
            <Star className="fill-current" size={16} />
            <span className="font-semibold">Featured Rooms</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Luxury Accommodations
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience comfort and elegance in our carefully designed rooms and suites, 
            each offering unique amenities and breathtaking views.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <span className="ml-3 text-gray-600">Loading featured rooms...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <p className="text-gray-600">Showing sample rooms instead</p>
          </div>
        )}

        {/* Rooms Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {rooms.map((room) => {
              const amenities = getRoomAmenities(room)
              const IconComponent = getAmenityIcon(amenities[0])
              return (
                <div key={room.id} className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  {/* Image */}
                  <div className="relative overflow-hidden">
                    <img 
                      src={getRoomImage(room)} 
                      alt={room.name}
                      className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
                        <Heart size={20} className="text-gray-600 hover:text-red-500" />
                      </button>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                        <Star className="fill-yellow-400 text-yellow-400" size={16} />
                        <span className="text-sm font-semibold text-gray-900">{typeof room?.ratingAvg === 'number' ? room.ratingAvg.toFixed(1) : '0.0'}</span>
                        <span className="text-xs text-gray-600">({room?.ratingCount ?? 0})</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{room.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Users size={16} />
                            <span>{room.maxAdults} Guests</span>
                          </div>
                          <span>{room.size} sqm</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">₹{(typeof room?.price === 'number' ? room.price.toLocaleString() : room?.price || '—')}</p>
                        <p className="text-sm text-gray-500">per night</p>
                      </div>
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {amenities.slice(0, 3).map((amenity, index) => {
                        const IconComponent = getAmenityIcon(amenity)
                        return (
                          <div key={index} className="flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                            <IconComponent size={14} />
                            <span>{amenity}</span>
                          </div>
                        )
                      })}
                      {amenities.length > 3 && (
                        <div className="flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                          <span>+{amenities.length - 3} more</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Link 
                        to={`/rooms/${room.id}`}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-3 rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105"
                      >
                        View Details
                      </Link>
                      <Link 
                        to={`/rooms/${room.id}/book`} 
                        className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center">
          <Link 
            to="/rooms"
            className="inline-flex items-center gap-2 bg-white border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-600 hover:text-white transition-all hover:scale-105"
          >
            View All Rooms
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default FeaturedRooms
