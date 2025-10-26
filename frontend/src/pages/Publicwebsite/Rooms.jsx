import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/Publicwebsite/Layout/Header'
import Footer from '../../components/Publicwebsite/Layout/Footer'
import { Star, Users, Wifi, Car, Coffee, Dumbbell, Heart, Search, Filter, Grid, List, Loader2, Sparkles, ChevronLeft, ChevronRight, SlidersHorizontal, ArrowRight } from 'lucide-react'
import { roomService } from '../../services/roomService'
import { buildMediaUrl } from '../../utils/media'

const Rooms = () => {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  })
  const [viewMode, setViewMode] = useState('grid')
  const [hoveredCard, setHoveredCard] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    roomType: 'all',
    minPrice: '',
    maxPrice: '',
    status: 'available',
    adults: '',
    children: '',
    amenities: ''
  })
  const [sortBy, setSortBy] = useState('price_asc')

  // Fetch rooms from backend
  const fetchRooms = useCallback(async (page = 1, limit = 12) => {
    try {
      setLoading(true)
      setError(null)
        // Clean filters - remove empty values
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== '' && value !== 'all')
      )

      const queryFilters = { ...cleanFilters, sort: sortBy }

      console.log('Fetching rooms with filters:', cleanFilters)

      const response = await roomService.getRooms(page, limit, queryFilters)

      console.log('API Response:', response)

      setRooms(response.data || [])
      setPagination({
        currentPage: response.currentPage || 1,
        totalPages: response.totalPages || 1,
        total: response.total || 0
      })
    } catch (err) {
      console.error('Error fetching rooms:', err)
      setError(err.message || 'Failed to fetch rooms')
      // Fallback to static data if API fails
      setRooms([
        {
          id: 1,
          name: 'Deluxe Suite',
          roomType: 'Suite',
          price: 8500,
          image: [{ url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80' }],
          maxAdults: 2,
          size: 45,
          amenity: [{ name: 'Free WiFi' }, { name: 'Parking' }, { name: 'Breakfast' }, { name: 'Gym' }],
          description: 'Spacious suite with modern amenities and city view'
        },
        {
          id: 2,
          name: 'Presidential Suite',
          roomType: 'Suite',
          price: 15000,
          image: [{ url: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80' }],
          maxAdults: 4,
          size: 85,
          amenity: [{ name: 'Free WiFi' }, { name: 'Parking' }, { name: 'Breakfast' }, { name: 'Gym' }, { name: 'Spa' }],
          description: 'Luxurious presidential suite with panoramic mountain views'
        },
        {
          id: 3,
          name: 'Executive Room',
          roomType: 'Room',
          price: 12000,
          image: [{ url: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80' }],
          maxAdults: 3,
          size: 65,
          amenity: [{ name: 'Free WiFi' }, { name: 'Parking' }, { name: 'Breakfast' }, { name: 'Gym' }],
          description: 'Executive room with business facilities and city view'
        },
        {
          id: 4,
          name: 'Standard Room',
          roomType: 'Room',
          price: 5500,
          image: [{ url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80' }],
          maxAdults: 2,
          size: 35,
          amenity: [{ name: 'Free WiFi' }, { name: 'Breakfast' }],
          description: 'Comfortable standard room with essential amenities'
        },
        {
          id: 5,
          name: 'Family Suite',
          roomType: 'Suite',
          price: 10000,
          image: [{ url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80' }],
          maxAdults: 4,
          size: 70,
          amenity: [{ name: 'Free WiFi' }, { name: 'Parking' }, { name: 'Breakfast' }, { name: 'Gym' }],
          description: 'Perfect for families with separate living and sleeping areas'
        },
        {
          id: 6,
          name: 'Honeymoon Suite',
          roomType: 'Suite',
          price: 18000,
          image: [{ url: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80' }],
          maxAdults: 2,
          size: 90,
          amenity: [{ name: 'Free WiFi' }, { name: 'Parking' }, { name: 'Breakfast' }, { name: 'Spa' }, { name: 'Romantic Setup' }],
          description: 'Romantic suite with special amenities for couples'
        }
      ])
      setPagination({
        currentPage: 1,
        totalPages: 1,
        total: 6
      })
    } finally {
      setLoading(false)
    }
  }, [filters, sortBy])

  // Fetch rooms on component mount and when filters change
  useEffect(() => {
    fetchRooms(1)
  }, [fetchRooms])

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value
    setFilters(prev => ({
      ...prev,
      search: value
    }))
  }

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
    const val = room?.image
    if (Array.isArray(val) && val.length > 0) {
      return buildMediaUrl(val[0]?.url || '')
    }
    return 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
  }

  // Helper function to get amenities
  const getRoomAmenities = (room) => {
    if (room.amenity && room.amenity.length > 0) {
      return room.amenity.map(a => a.name)
    }
    return ['Free WiFi', 'Parking', 'Breakfast']
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 rounded-full mix-blend-overlay filter blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-lg rounded-full px-6 py-3 mb-8 border border-white/20">
              <Sparkles className="animate-pulse" size={24} />
              <span className="font-bold text-lg tracking-wide">LUXURY ACCOMMODATIONS</span>
              <Sparkles className="animate-pulse" size={24} />
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">
              Our Rooms & <span className="text-transparent bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text">Suites</span>
            </h1>
            <p className="text-xl text-white/90 mb-12 leading-relaxed max-w-2xl mx-auto">
              Discover our meticulously designed accommodations, each offering unparalleled comfort,
              unique amenities, and breathtaking panoramic views for an unforgettable luxury experience.
            </p>
          </div>
        </div>
      </section>

      <main className="py-20">
        <div className="container mx-auto px-4">
          {/* Filters and Search */}
          <div className="mb-16">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="flex flex-col xl:flex-row gap-8">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={24} />
                    <input
                      type="text"
                      placeholder="Search luxury rooms and suites..."
                      value={filters.search}
                      onChange={handleSearch}
                      className="w-full pl-12 pr-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-gray-50/50 backdrop-blur-sm"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4">
                  <div className="relative">
                    <SlidersHorizontal className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      value={filters.roomType}
                      onChange={(e) => handleFilterChange('roomType', e.target.value)}
                      className="pl-10 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm appearance-none cursor-pointer"
                    >
                      <option value="all">All Types</option>
                      <option value="Room">Rooms</option>
                      <option value="Suite">Suites</option>
                      <option value="Deluxe">Deluxe</option>
                      <option value="Executive">Executive</option>
                      <option value="Presidential">Presidential</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      placeholder="Min ₹"
                      className="px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm w-32"
                    />
                    <input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      placeholder="Max ₹"
                      className="px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm w-32"
                    />
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      value={filters.adults}
                      onChange={(e) => handleFilterChange('adults', e.target.value)}
                      placeholder="Adults"
                      className="px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm w-28"
                    />
                    <input
                      type="number"
                      min="0"
                      value={filters.children}
                      onChange={(e) => handleFilterChange('children', e.target.value)}
                      placeholder="Children"
                      className="px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm w-28"
                    />
                  </div>

                  <input
                    type="text"
                    value={filters.amenities}
                    onChange={(e) => handleFilterChange('amenities', e.target.value)}
                    placeholder="Amenities (WiFi, Spa, Gym...)"
                    className="px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm flex-1 min-w-80"
                  />
                </div>

                {/* View Mode */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-4 rounded-2xl transition-all duration-300 hover:scale-110 ${
                      viewMode === 'grid'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl'
                        : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white shadow-lg border border-gray-200'
                    }`}
                  >
                    <Grid size={24} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-4 rounded-2xl transition-all duration-300 hover:scale-110 ${
                      viewMode === 'list'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl'
                        : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white shadow-lg border border-gray-200'
                    }`}
                  >
                    <List size={24} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Count and Sort */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
            <div className="flex items-center gap-6">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl px-6 py-4 shadow-lg border border-white/20">
                <p className="text-gray-700 font-semibold">
                  <span className="text-2xl font-black text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">{pagination.total}</span>
                  <span className="ml-2">luxury rooms available</span>
                </p>
              </div>
              <button
                onClick={() => fetchRooms(1)}
                className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold shadow-lg"
              >
                🔄 Refresh
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm appearance-none cursor-pointer font-medium"
              >
                <option value="price_asc">💰 Price: Low to High</option>
                <option value="price_desc">💎 Price: High to Low</option>
                <option value="name_asc">🏷️ Name (A-Z)</option>
                <option value="created_desc">🆕 Newest First</option>
              </select>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <Loader2 className="animate-spin text-blue-500" size={64} />
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
              </div>
              <span className="mt-8 text-gray-600 font-semibold text-xl">Discovering luxury accommodations...</span>
              <div className="mt-4 flex gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-20">
              <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-12 max-w-lg mx-auto shadow-xl">
                <div className="text-6xl mb-6">😔</div>
                <p className="text-red-600 mb-4 font-bold text-lg">{error}</p>
                <p className="text-gray-600 text-sm">Showing curated sample rooms instead</p>
              </div>
            </div>
          )}

          {/* Rooms Grid/List */}
          {!loading && (
            <div className={`${
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
                : 'space-y-8'
            }`}>
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
                            {room.roomType || 'ROOM'}
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
                              ₹{(typeof room?.price === 'number' ? room.price.toLocaleString() : room?.price || '—')}
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
                            <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
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

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-6 mt-16">
              <button
                onClick={() => fetchRooms(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="flex items-center gap-2 px-6 py-4 bg-white/80 backdrop-blur-xl border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 shadow-lg disabled:shadow-none font-semibold"
              >
                <ChevronLeft size={20} />
                Previous
              </button>

              <div className="flex gap-3">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => fetchRooms(page)}
                    className={`px-6 py-4 rounded-2xl transition-all duration-300 hover:scale-110 font-bold shadow-lg ${
                      page === pagination.currentPage
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl'
                        : 'bg-white/80 backdrop-blur-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => fetchRooms(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="flex items-center gap-2 px-6 py-4 bg-white/80 backdrop-blur-xl border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 shadow-lg disabled:shadow-none font-semibold"
              >
                Next
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />

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
    </div>
  )
}

export default Rooms
