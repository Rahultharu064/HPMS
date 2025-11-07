import React, { useEffect, useState } from 'react'
import { Bed, Users, DollarSign, Ruler, Image as ImageIcon, RefreshCw } from 'lucide-react'
import { roomService } from '../../../services/roomService'

const RoomAvailability = () => {
  const [availability, setAvailability] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadAvailability()
  }, [])

  const loadAvailability = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await roomService.getRoomAvailability()
      if (res?.success) {
        setAvailability(res.data || [])
      } else {
        setError(res?.error || 'Failed to load room availability')
      }
    } catch (err) {
      console.error('Failed to load room availability', err)
      setError(err?.message || 'Failed to load room availability')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center gap-3">
          <RefreshCw className="animate-spin text-blue-500" size={24} />
          <span className="text-gray-600">Loading room availability...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <button
          onClick={loadAvailability}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Room Availability</h2>
        <button
          onClick={loadAvailability}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {availability.length === 0 ? (
        <div className="text-center py-12">
          <Bed className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Rooms Available</h3>
          <p className="text-gray-600">No room data found in the system.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availability.map((roomType) => (
            <div key={roomType.roomType} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{roomType.roomType}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users size={16} />
                      <span>Max {roomType.maxAdults} adults</span>
                    </div>
                    {roomType.maxChildren > 0 && (
                      <div className="flex items-center gap-1">
                        <Users size={16} />
                        <span>Max {roomType.maxChildren} children</span>
                      </div>
                    )}
                  </div>
                </div>
                {roomType.thumbnail && (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${roomType.thumbnail}`}
                      alt={roomType.roomType}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                    <div className="w-full h-full items-center justify-center text-gray-400 hidden">
                      <ImageIcon size={24} />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Rooms:</span>
                  <span className="font-semibold">{roomType.total}</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{roomType.available}</div>
                    <div className="text-xs text-gray-600">Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{roomType.occupied}</div>
                    <div className="text-xs text-gray-600">Occupied</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{roomType.maintenance}</div>
                    <div className="text-xs text-gray-600">Maintenance</div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign size={16} className="text-green-600" />
                    <span className="font-semibold text-lg">NPR {roomType.price.toLocaleString()}</span>
                    <span className="text-gray-600">/night</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Bed size={16} />
                    <span>{roomType.numBeds} bed{roomType.numBeds > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Ruler size={16} />
                    <span>{roomType.size} sq ft</span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                {roomType.available > 0 ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-sm font-medium">{roomType.available} room{roomType.available > 1 ? 's' : ''} available</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    <span className="text-sm font-medium">No rooms available</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Quick Stats</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-bold text-blue-600">{availability.reduce((sum, type) => sum + type.total, 0)}</div>
            <div className="text-blue-700">Total Rooms</div>
          </div>
          <div>
            <div className="font-bold text-green-600">{availability.reduce((sum, type) => sum + type.available, 0)}</div>
            <div className="text-green-700">Available</div>
          </div>
          <div>
            <div className="font-bold text-blue-600">{availability.reduce((sum, type) => sum + type.occupied, 0)}</div>
            <div className="text-blue-700">Occupied</div>
          </div>
          <div>
            <div className="font-bold text-orange-600">{availability.reduce((sum, type) => sum + type.maintenance, 0)}</div>
            <div className="text-orange-700">Maintenance</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoomAvailability
