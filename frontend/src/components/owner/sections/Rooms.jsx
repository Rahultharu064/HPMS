import React, { useMemo, useState, useEffect } from 'react'
import { Plus, Eye, Edit, Trash2, Loader2, RefreshCw, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { roomService } from '../../../services/roomService'
import UpdateRoom from './UpdateRoom'
import ViewRoom from './ViewRoom'

const getStatusColor = (status) => {
  const colors = {
    'available': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'occupied': 'bg-blue-100 text-blue-700 border-blue-200',
    'maintenance': 'bg-amber-100 text-amber-700 border-amber-200',
    'booked': 'bg-purple-100 text-purple-700 border-purple-200',
    'cleaning': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Available': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Occupied': 'bg-blue-100 text-blue-700 border-blue-200',
    'Maintenance': 'bg-amber-100 text-amber-700 border-amber-200',
    'Paid': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Synced': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Active': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Confirmed': 'bg-emerald-100 text-emerald-700 border-emerald-200'
  }
  return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
}

const Rooms = ({ darkMode, onSelectRoom }) => {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  })
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)

  // Fetch rooms from backend
  const fetchRooms = async (page = 1, limit = 10) => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await roomService.getRooms(page, limit)
      
      setRooms(data.data)
      setPagination({
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        total: data.total
      })
    } catch (err) {
      setError(err.message || 'Network error: Unable to fetch rooms')
      console.error('Error fetching rooms:', err)
    } finally {
      setLoading(false)
    }
  }

  // Delete room
  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return
    
    try {
      console.log('Attempting to delete room with ID:', roomId)
      const result = await roomService.deleteRoom(roomId)
      console.log('Delete result:', result)
      
      // Show success message
      alert('Room deleted successfully!')
      
      // Refresh the rooms list
      fetchRooms(pagination.currentPage)
    } catch (err) {
      console.error('Error deleting room:', err)
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        roomId: roomId
      })
      
      // More detailed error message
      const errorMessage = err.message || 'Network error: Unable to delete room'
      alert(`Failed to delete room: ${errorMessage}`)
    }
  }

  // Calculate room statistics from fetched data
  const topStats = useMemo(() => {
    const total = rooms.length
    const available = rooms.filter(room => room.status === 'available').length
    const occupied = rooms.filter(room => room.status === 'occupied').length
    const maintenance = rooms.filter(room => room.status === 'maintenance').length
    
    return [
      { label: 'Total Rooms', value: total.toString(), color: 'gray' },
      { label: 'Available', value: available.toString(), color: 'emerald' },
      { label: 'Occupied', value: occupied.toString(), color: 'blue' },
      { label: 'Maintenance', value: maintenance.toString(), color: 'amber' }
    ]
  }, [rooms])

  // Handle view room
  const handleViewRoom = (room) => {
    setSelectedRoom(room)
    if (onSelectRoom) onSelectRoom(room)
    setShowViewModal(true)
  }

  // Handle edit room
  const handleEditRoom = (room) => {
    setSelectedRoom(room)
    if (onSelectRoom) onSelectRoom(room)
    setShowUpdateModal(true)
  }

  // Handle add room - navigate to create room page
  const handleAddRoom = () => {
    navigate('/owner-admin/create-room')
  }

  // Handle add room type - navigate to room types page
  const handleAddRoomType = () => {
    navigate('/owner-admin/room-types')
  }

  // Handle successful update
  const handleUpdateSuccess = () => {
    fetchRooms(pagination.currentPage)
  }

  // Close modals
  const closeModals = () => {
    setShowUpdateModal(false)
    setShowViewModal(false)
    setSelectedRoom(null)
  }

  // Fetch rooms on component mount
  useEffect(() => {
    fetchRooms()
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {topStats.map((stat, idx) => (
          <div key={idx} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{stat.label}</p>
            <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Room Management</h3>
          <div className="flex gap-3">
            <button
              onClick={() => fetchRooms(pagination.currentPage)}
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
              onClick={handleAddRoomType}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-2xl hover:shadow-lg transition-all"
            >
              <Settings size={20} />
              <span>Add Room Type</span>
            </button>
            <button
              onClick={handleAddRoom}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:shadow-lg transition-all"
            >
              <Plus size={20} />
              <span>Add Room</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <span className={`ml-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading rooms...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className={`text-red-500 mb-4`}>{error}</p>
            <button 
              onClick={() => fetchRooms()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="flex gap-6">
            <div className="flex-1 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Room</th>
                    <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Type</th>
                    <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Status</th>
                    <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Price</th>
                    <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Capacity</th>
                    <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12">
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No rooms found</p>
                      </td>
                    </tr>
                  ) : (
                    rooms.map((room) => (
                      <tr
                        key={room.id}
                        className={`border-b cursor-pointer ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                        onClick={() => { setSelectedRoom(room); if (onSelectRoom) onSelectRoom(room) }}
                      >
                        <td className="py-4 px-4">
                          <div>
                            <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{room.name}</p>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Room #{room.roomNumber}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{room.roomType}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(room.status)}`}>
                            {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>₹{room.price.toLocaleString()}</p>
                        </td>
                        <td className="py-4 px-4">
                          <div className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <p className="text-sm">{room.maxAdults} Adults</p>
                            {room.maxChildren > 0 && <p className="text-sm">{room.maxChildren} Children</p>}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleViewRoom(room) }}
                              className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleEditRoom(room) }}
                              className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                              title="Edit Room"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id) }}
                              className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400' : 'hover:bg-gray-100 text-gray-600 hover:text-red-600'} transition-colors`}
                              title="Delete Room"
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
                    Showing {rooms.length} of {pagination.total} rooms
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchRooms(pagination.currentPage - 1)}
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
                      onClick={() => fetchRooms(pagination.currentPage + 1)}
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

            {/* Right-side details panel */}
            {selectedRoom && (
              <div className={`w-80 shrink-0 rounded-3xl p-6 shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Selected Room Features</h4>
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="flex justify-between"><span>Room</span><span>#{selectedRoom.roomNumber}</span></div>
                    <div className="flex justify-between"><span>Type</span><span>{selectedRoom.roomType}</span></div>
                    <div className="flex justify-between"><span>Size</span><span>{selectedRoom.size} sq ft</span></div>
                    <div className="flex justify-between"><span>Beds</span><span>{selectedRoom.numBeds}</span></div>
                    <div className="flex justify-between"><span>Adults</span><span>{selectedRoom.maxAdults}</span></div>
                    {selectedRoom.allowChildren && (
                      <div className="flex justify-between"><span>Children</span><span>{selectedRoom.maxChildren}</span></div>
                    )}
                  </div>
                  {Array.isArray(selectedRoom.amenity) && selectedRoom.amenity.length > 0 && (
                    <div>
                      <p className={`text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Amenities</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedRoom.amenity.map((a, i) => (
                          <span key={i} className={`px-2 py-1 rounded-full text-xs border ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}>{a.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showViewModal && selectedRoom && (
        <ViewRoom 
          room={selectedRoom} 
          onClose={closeModals} 
          darkMode={darkMode} 
        />
      )}
      {showUpdateModal && selectedRoom && (
        <UpdateRoom 
          room={selectedRoom} 
          onClose={closeModals} 
          onSuccess={handleUpdateSuccess}
          darkMode={darkMode} 
        />
      )}
    </div>
  )
}

export default Rooms
