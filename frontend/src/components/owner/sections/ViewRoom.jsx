import React from 'react'
import { X, MapPin, Users, Bed, Wifi, Car, Coffee, Dumbbell, Waves, Utensils } from 'lucide-react'

const amenityIcons = {
  'wifi': Wifi,
  'parking': Car,
  'breakfast': Coffee,
  'gym': Dumbbell,
  'pool': Waves,
  'restaurant': Utensils,
  'default': MapPin
}

const ViewRoom = ({ room, onClose, darkMode }) => {
  const getAmenityIcon = (amenityName) => {
    const name = amenityName.toLowerCase()
    for (const [key, icon] of Object.entries(amenityIcons)) {
      if (name.includes(key)) return icon
    }
    return amenityIcons.default
  }

  const getStatusColor = (status) => {
    const colors = {
      'available': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'occupied': 'bg-blue-100 text-blue-700 border-blue-200',
      'maintenance': 'bg-amber-100 text-amber-700 border-amber-200',
      'cleaning': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'booked': 'bg-purple-100 text-purple-700 border-purple-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Room Details: {room?.name}
            </h2>
            <button 
              onClick={onClose}
              className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
            >
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Room Images */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Room Images</h3>
              {room?.image && room.image.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {room.image.slice(0, 4).map((img, idx) => (
                    <div key={idx} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                      <img 
                        src={`http://localhost:5000/uploads/${img.url}`} 
                        alt={`Room ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500" style={{display: 'none'}}>
                        <span>No Image</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No images available</span>
                </div>
              )}
            </div>

            {/* Room Information */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Room Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Room Number:</span>
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>#{room?.roomNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Type:</span>
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{room?.roomType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Floor:</span>
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{room?.floor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Size:</span>
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{room?.size} sq ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Price:</span>
                    <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>₹{room?.price?.toLocaleString()}/night</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(room?.status)}`}>
                      {room?.status?.charAt(0).toUpperCase() + room?.status?.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Capacity */}
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Capacity</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Users className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`} size={20} />
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Max Adults:</span>
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{room?.maxAdults}</span>
                  </div>
                  {room?.allowChildren && (
                    <div className="flex items-center gap-3">
                      <Users className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`} size={20} />
                      <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Max Children:</span>
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{room?.maxChildren}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Bed className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`} size={20} />
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Number of Beds:</span>
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{room?.numBeds}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {room?.description && (
            <div className="mt-6">
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Description</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                {room.description}
              </p>
            </div>
          )}

          {/* Amenities */}
          {room?.amenity && room.amenity.length > 0 && (
            <div className="mt-6">
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {room.amenity.map((amenity, idx) => {
                  const IconComponent = getAmenityIcon(amenity.name)
                  return (
                    <div key={idx} className={`flex items-center gap-2 p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <IconComponent className={`${darkMode ? 'text-blue-400' : 'text-blue-600'}`} size={16} />
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {amenity.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Videos */}
          {room?.video && room.video.length > 0 && (
            <div className="mt-6">
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Videos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {room.video.map((video, idx) => (
                  <div key={idx} className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                    <video 
                      controls 
                      className="w-full h-full"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    >
                      <source src={`http://localhost:5000/uploads/${video.url}`} type={video.type} />
                    </video>
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500" style={{display: 'none'}}>
                      <span>Video not available</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Created:</span>
                <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {room?.createdAt ? new Date(room.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div>
                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Last Updated:</span>
                <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {room?.updatedAt ? new Date(room.updatedAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewRoom
