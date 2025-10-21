import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/publicwebsite/Layout/Header'
import Footer from '../../components/publicwebsite/Layout/Footer'
import { Star, Users, Wifi, Car, Coffee, Dumbbell, Heart, Search, Filter, Grid, List, Loader2 } from 'lucide-react'
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
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-blue-900 to-purple-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Our Rooms & Suites</h1>
            <p className="text-xl text-white/90 mb-8">
              Discover our carefully designed accommodations, each offering unique amenities 
              and breathtaking views for an unforgettable stay.
            </p>
          </div>
        </div>
      </section>

      <main className="py-16">
        <div className="container mx-auto px-4">
          {/* Filters and Search */}
          <div className="mb-12">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                      type="text" 
                      placeholder="Search rooms..."
                      value={filters.search}
                      onChange={handleSearch}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4">
                  <select 
                    value={filters.roomType}
                    onChange={(e) => handleFilterChange('roomType', e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="Room">Rooms</option>
                    <option value="Suite">Suites</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Executive">Executive</option>
                    <option value="Presidential">Presidential</option>
                  </select>

                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    placeholder="Min Price"
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
                  />
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    placeholder="Max Price"
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
                  />

                  <input
                    type="number"
                    min="0"
                    value={filters.adults}
                    onChange={(e) => handleFilterChange('adults', e.target.value)}
                    placeholder="Adults"
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
                  />
                  <input
                    type="number"
                    min="0"
                    value={filters.children}
                    onChange={(e) => handleFilterChange('children', e.target.value)}
                    placeholder="Children"
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
                  />

                  <input
                    type="text"
                    value={filters.amenities}
                    onChange={(e) => handleFilterChange('amenities', e.target.value)}
                    placeholder="Amenities (comma separated)"
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
                  />
                </div>

                {/* View Mode */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-3 rounded-xl transition-colors ${
                      viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Grid size={20} />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-3 rounded-xl transition-colors ${
                      viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <List size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <p className="text-gray-600">
                Showing {pagination.total} rooms available
              </p>
              <button 
                onClick={() => fetchRooms(1)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Refresh
              </button>
            </div>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="price_asc">Sort by Price: Low to High</option>
              <option value="price_desc">Sort by Price: High to Low</option>
              <option value="name_asc">Sort by Name</option>
              <option value="created_desc">Sort by Newest</option>
            </select>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <span className="ml-3 text-gray-600">Loading rooms...</span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <p className="text-gray-600">Showing sample rooms instead</p>
            </div>
          )}

          {/* Rooms Grid/List */}
          {!loading && (
            <div className={`${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' 
                : 'space-y-6'
            }`}>
              {rooms.map((room) => {
                const amenities = getRoomAmenities(room)
                const IconComponent = getAmenityIcon(amenities[0])
                return (
                  <div key={room.id} className={`group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}>
                    {/* Image */}
                    <div className={`relative overflow-hidden ${
                      viewMode === 'list' ? 'w-80 h-64' : 'h-64'
                    }`}>
                      <img 
                        src={getRoomImage(room)} 
                        alt={room.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
                          <Heart size={20} className="text-gray-600 hover:text-red-500" />
                        </button>
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                          <Star className="fill-yellow-400 text-yellow-400" size={16} />
                          <span className="text-sm font-semibold text-gray-900">4.8</span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{room.name}</h3>
                          <p className="text-gray-600 mb-2">{room.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Users size={16} />
                              <span>{room.maxAdults} Guests</span>
                            </div>
                            <span>{room.size} sqm</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">₹{room.price.toLocaleString()}</p>
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

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-12">
              <button 
                onClick={() => fetchRooms(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button 
                onClick={() => fetchRooms(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Rooms
