import React, { useEffect, useMemo, useState } from 'react'
import { CheckCircle, AlertCircle, User, Wrench } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getSocket } from '../../../utils/socket'
import { roomService } from '../../../services/roomService'
import { housekeeperService } from '../../../services/housekeeperService'
import { API_BASE_URL } from '../../../utils/api'
import authService from '../../../services/authService'
import ReportIssueModal from '../modals/ReportIssueModal'

const Dashboard = ({ darkMode, setActiveTab }) => {
  const [loading, setLoading] = useState(true)
  const [rooms, setRooms] = useState([])
  const [housekeepers, setHousekeepers] = useState([])
  const [showReportModal, setShowReportModal] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const [roomsRes, housekeepersRes] = await Promise.all([
          roomService.getStatusMap({}),
          housekeeperService.list()
        ])
        if (!mounted) return
        setRooms(roomsRes?.data || [])
        setHousekeepers(housekeepersRes?.data || [])
      } catch (e) { console.error(e); toast.error('Failed to load dashboard data') }
      finally { setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [])

  // Live updates via WebSocket
  useEffect(() => {
    const socket = getSocket()
    const handler = () => {
      // re-fetch room status on any room status change
      roomService.getStatusMap({})
        .then(res => setRooms(res?.data || []))
        .catch(e => { console.error(e) })
    }
    socket.on('hk:room:status', handler)
    socket.on('hk:task:created', handler)
    socket.on('hk:task:updated', handler)
    socket.on('hk:task:deleted', handler)
    return () => {
      socket.off('hk:room:status', handler)
      socket.off('hk:task:created', handler)
      socket.off('hk:task:updated', handler)
      socket.off('hk:task:deleted', handler)
    }
  }, [])

  const kpis = useMemo(() => {
    const statusCounts = {
      clean: 0,
      'needs-cleaning': 0,
      occupied: 0,
      maintenance: 0
    }

    for (const room of rooms) {
      const status = String(room.status || 'available')
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++
      }
    }

    return statusCounts
  }, [rooms])

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getAssignedHousekeeper = (roomId) => {
    return housekeepers.find(hk => hk.assignedRooms?.includes(roomId))
  }

  const assignHousekeeper = async (roomId, housekeeperId) => {
    try {
      // This would call an API to assign housekeeper to room
      // For now, we'll simulate the assignment
      toast.success(`Housekeeper assigned to room #${roomId}`)
      // Refresh data
      const [roomsRes, housekeepersRes] = await Promise.all([
        roomService.getStatusMap({}),
        housekeeperService.list()
      ])
      setRooms(roomsRes?.data || [])
      setHousekeepers(housekeepersRes?.data || [])
    } catch (e) {
      console.error(e)
      toast.error('Failed to assign housekeeper')
    }
  }

  const handleLogout = () => {
    authService.logout()
    toast.success('Logged out successfully')
    window.location.href = '/housekeeping/login'
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-5`}>
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Clean Rooms</div>
          </div>
          <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{loading ? '...' : kpis.clean}</div>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-5`}>
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Needs Cleaning</div>
          </div>
          <div className={`text-3xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{loading ? '...' : kpis['needs-cleaning']}</div>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-5`}>
          <div className="flex items-center gap-3 mb-2">
            <User className="w-6 h-6 text-blue-500" />
            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Occupied</div>
          </div>
          <div className={`text-3xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{loading ? '...' : kpis.occupied}</div>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-5`}>
          <div className="flex items-center gap-3 mb-2">
            <Wrench className="w-6 h-6 text-orange-500" />
            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Maintenance</div>
          </div>
          <div className={`text-3xl font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>{loading ? '...' : kpis.maintenance}</div>
        </div>
      </div>

      <div className={`${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white'} border rounded-2xl p-6 shadow-xl`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setActiveTab('rooms')} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all">
            View All Rooms
          </button>
          <button onClick={() => setActiveTab('schedule')} className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all">
            Today's Schedule
          </button>
          <button onClick={() => setActiveTab('staff')} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl font-medium hover:shadow-lg transition-all">
            Staff Assignment
          </button>
          <button onClick={() => setShowReportModal(true)} className={`${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-6 py-3 rounded-xl font-medium transition-all`}>
            Report Issue
          </button>
        </div>
      </div>

      {/* Room Status Board */}
      <div className={`${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white'} border rounded-2xl p-6 shadow-xl`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Room Status Board</h3>
          <div className="flex gap-2">
            <select className={`${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'} px-3 py-2 rounded-lg border text-sm`}>
              <option value="all">All Rooms</option>
              <option value="clean">Clean</option>
              <option value="needs-cleaning">Needs Cleaning</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading rooms...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rooms.slice(0, 8).map(room => {
              // Find assigned housekeeper
              const assignedHousekeeper = housekeepers.find(hk => hk.assignedRooms?.includes(room.id))
              return (
                <div key={room.id} className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4 hover:shadow-md transition-all`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>#{room.roomNumber}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${room.status === 'clean' ? 'bg-green-100 text-green-800' :
                        room.status === 'needs-cleaning' ? 'bg-red-100 text-red-800' :
                          room.status === 'occupied' ? 'bg-blue-100 text-blue-800' :
                            room.status === 'maintenance' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                      }`}>
                      {room.status?.replace('-', ' ') || 'Unknown'}
                    </span>
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Floor {room.floor || 'N/A'}
                  </div>
                  <div
                    className="mt-2 flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 p-2 rounded-lg transition-colors"
                    onClick={() => {
                      // For now, just show a simple assignment
                      if (!assignedHousekeeper && housekeepers.length > 0) {
                        assignHousekeeper(room.id, housekeepers[0].id)
                      }
                    }}
                  >
                    {assignedHousekeeper ? (
                      <>
                        {assignedHousekeeper.profilePictureUrl ? (
                          <img
                            src={`${API_BASE_URL}/${assignedHousekeeper.profilePictureUrl}`}
                            alt={assignedHousekeeper.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {getInitials(assignedHousekeeper.name)}
                          </div>
                        )}
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {assignedHousekeeper.name}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-6 h-6 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          ?
                        </div>
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {housekeepers.length > 0 ? 'Click to assign' : 'No housekeepers'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
            {rooms.length > 8 && (
              <div className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4 flex items-center justify-center`}>
                <button
                  onClick={() => setActiveTab('rooms')}
                  className={`text-sm font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
                >
                  View {rooms.length - 8} more rooms →
                </button>
              </div>
            )}
          </div>
        )}
      </div>


      <ReportIssueModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        darkMode={darkMode}
      />
    </div>
  )
}

export default Dashboard
