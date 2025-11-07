import React, { useState, useEffect } from 'react'
import { Plus, Eye, Edit, Trash2, Loader2, RefreshCw, Bed, Users, DollarSign, Ruler } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { roomTypeService } from '../../../services/roomTypeService'

const RoomTypes = ({ darkMode }) => {
  const [roomTypes, setRoomTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedRoomType, setSelectedRoomType] = useState(null)
  const [formData, setFormData] = useState({
    name: ''
  })

  // Fetch room types
  const fetchRoomTypes = async (page = 1, limit = 10) => {
    try {
      setLoading(true)
      setError(null)

      const response = await roomTypeService.getRoomTypes(page, limit)
      setRoomTypes(response.data)
      setPagination({
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        total: response.total
      })
    } catch (err) {
      setError(err.message || 'Failed to fetch room types')
      console.error('Error fetching room types:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle amenity changes
  const handleAmenityChange = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }))
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: ''
    })
  }

  // Handle create room type
  const handleCreate = async () => {
    try {
      await roomTypeService.createRoomType(formData)
      toast.success('Room type created successfully!')
      setShowCreateModal(false)
      resetForm()
      fetchRoomTypes()
    } catch (err) {
      toast.error(err.message || 'Failed to create room type')
    }
  }

  // Handle edit room type
  const handleEdit = (roomType) => {
    setSelectedRoomType(roomType)
    setFormData({
      name: roomType.name
    })
    setShowEditModal(true)
  }

  // Handle update room type
  const handleUpdate = async () => {
    try {
      await roomTypeService.updateRoomType(selectedRoomType.id, formData)
      toast.success('Room type updated successfully!')
      setShowEditModal(false)
      resetForm()
      fetchRoomTypes()
    } catch (err) {
      toast.error(err.message || 'Failed to update room type')
    }
  }

  // Handle delete room type
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room type? This action cannot be undone.')) return

    try {
      await roomTypeService.deleteRoomType(id)
      toast.success('Room type deleted successfully!')
      fetchRoomTypes()
    } catch (err) {
      toast.error(err.message || 'Failed to delete room type')
    }
  }

  // Close modals
  const closeModals = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setSelectedRoomType(null)
    resetForm()
  }

  useEffect(() => {
    fetchRoomTypes()
  }, [])

  const commonAmenities = [
    'WiFi', 'Air Conditioning', 'TV', 'Mini Bar', 'Safe', 'Balcony',
    'Ocean View', 'City View', 'Mountain View', 'Jacuzzi', 'Kitchenette'
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total Room Types</p>
          <p className="text-2xl font-bold text-blue-600">{pagination.total}</p>
        </div>
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Active Types</p>
          <p className="text-2xl font-bold text-green-600">{roomTypes.filter(rt => rt.active).length}</p>
        </div>
      </div>

      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Room Types Management</h3>
          <div className="flex gap-3">
            <button
              onClick={() => fetchRoomTypes(pagination.currentPage)}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${
                darkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              } transition-colors disabled:opacity-50`}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:shadow-lg transition-all transform hover:scale-105"
            >
              <Plus size={20} />
              <span>Add Room Type</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <span className={`ml-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading room types...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className={`text-red-500 mb-4`}>{error}</p>
            <button
              onClick={() => fetchRoomTypes()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Room Type ID</th>
                  <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Room Type</th>
                  <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roomTypes.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center py-12">
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No room types found</p>
                    </td>
                  </tr>
                ) : (
                  roomTypes.map((roomType) => (
                    <tr
                      key={roomType.id}
                      className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                    >
                      <td className="py-4 px-4">
                        <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{roomType.id}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{roomType.name}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(roomType)}
                            className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                            title="Edit Room Type"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(roomType.id)}
                            className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400' : 'hover:bg-gray-100 text-gray-600 hover:text-red-600'} transition-colors`}
                            title="Delete Room Type"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Showing {roomTypes.length} of {pagination.total} room types
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchRoomTypes(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      pagination.currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    Previous
                  </button>
                  <span className={`px-3 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => fetchRoomTypes(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      pagination.currentPage === pagination.totalPages
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 w-full max-w-md`}>
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Create Room Type</h3>

            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
                placeholder="e.g., Deluxe Suite"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={closeModals}
                className={`px-6 py-2 rounded-lg border ${
                  darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                } transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create Room Type
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Edit Room Type</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                  placeholder="e.g., Deluxe Suite"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Base Price (₹) *</label>
                <input
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => handleInputChange('basePrice', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                  placeholder="5000"
                  min="0"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Max Adults *</label>
                <input
                  type="number"
                  value={formData.maxAdults}
                  onChange={(e) => handleInputChange('maxAdults', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                  min="1"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Max Children</label>
                <input
                  type="number"
                  value={formData.maxChildren}
                  onChange={(e) => handleInputChange('maxChildren', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                  min="0"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Number of Beds *</label>
                <input
                  type="number"
                  value={formData.numBeds}
                  onChange={(e) => handleInputChange('numBeds', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                  min="1"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Size (sq ft) *</label>
                <input
                  type="number"
                  value={formData.size}
                  onChange={(e) => handleInputChange('size', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                  placeholder="350"
                  min="0"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
                placeholder="Room description..."
              />
            </div>

            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Amenities</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {commonAmenities.map((amenity) => (
                  <label key={amenity} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      onChange={() => handleAmenityChange(amenity)}
                      className="rounded"
                    />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => handleInputChange('active', e.target.checked)}
                  className="rounded"
                />
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Active</span>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={closeModals}
                className={`px-6 py-2 rounded-lg border ${
                  darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                } transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Update Room Type
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoomTypes
