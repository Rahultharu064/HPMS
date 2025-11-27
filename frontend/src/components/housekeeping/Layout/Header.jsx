import React, { useEffect, useMemo, useState } from 'react'
import { Bell, ChevronDown, Menu, Moon, Sun, LogOut, User } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getSocket } from '../../../utils/socket'
import authService from '../../../services/authService'
import { hkHousekeeperService } from '../../../services/hkHousekeeperService'
import { hkTaskService } from '../../../services/hkTaskService'
import { hkCleaningService } from '../../../services/hkCleaningService'
import { Navigate } from 'react-router-dom'

const Header = ({ darkMode, setDarkMode, showNotifications, setShowNotifications, showProfile, setShowProfile, sidebarOpen, setSidebarOpen }) => {
  const [items, setItems] = useState([])
  const [userData, setUserData] = useState(null)
  const unread = useMemo(() => items.filter(i => !i.read).length, [items])

  useEffect(() => {
    const socket = getSocket()
    const onRoom = (payload) => {
      const room = payload?.room
      if (!room) return
      const statusText = room.status.replace('-', ' ')
      const icon = room.status === 'needs-cleaning' ? '🔴' :
        room.status === 'clean' ? '✅' :
          room.status === 'occupied' ? '👤' : '🔧'
      setItems(prev => [{
        id: `room-${room.id}-${Date.now()}`,
        msg: `${icon} Room #${room.roomNumber} is ${statusText}`,
        time: new Date().toLocaleTimeString(),
        read: false,
        type: 'room_status',
        roomId: room.id
      }, ...prev].slice(0, 20))
    }
    const onTask = (payload) => {
      const t = payload?.task
      if (!t && !payload?.id) return
      const icon = t?.priority === 'URGENT' ? '🚨' :
        t?.priority === 'HIGH' ? '⚠️' : '📋'
      const msg = payload?.id ? `🗑️ Task #${payload.id} deleted` : `${icon} Task: ${t.title} (${t.status})`
      setItems(prev => [{
        id: `task-${Date.now()}`,
        msg,
        time: new Date().toLocaleTimeString(),
        read: false,
        type: 'task',
        taskId: t?.id || payload?.id
      }, ...prev].slice(0, 20))
    }
    const onCleaning = (payload) => {
      const log = payload?.log
      if (!log) return
      const icon = log.finishedAt ? '✨' : '🧹'
      const action = log.finishedAt ? 'completed cleaning' : 'started cleaning'
      setItems(prev => [{
        id: `cleaning-${log.id}-${Date.now()}`,
        msg: `${icon} Room #${log.roomId} ${action}`,
        time: new Date().toLocaleTimeString(),
        read: false,
        type: 'cleaning',
        roomId: log.roomId
      }, ...prev].slice(0, 20))
    }
    socket.on('hk:room:status', onRoom)
    socket.on('hk:task:created', onTask)
    socket.on('hk:task:updated', onTask)
    socket.on('hk:task:deleted', onTask)
    socket.on('hk:cleaning:start', onCleaning)
    socket.on('hk:cleaning:finish', onCleaning)
    return () => {
      socket.off('hk:room:status', onRoom)
      socket.off('hk:task:created', onTask)
      socket.off('hk:task:updated', onTask)
      socket.off('hk:task:deleted', onTask)
      socket.off('hk:cleaning:start', onCleaning)
      socket.off('hk:cleaning:finish', onCleaning)
    }
  }, [])

  useEffect(() => {
    if (showNotifications) {
      setItems(prev => prev.map(i => ({ ...i, read: true })))
    }
  }, [showNotifications])

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get current user data from localStorage or API
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (user && user.id) {
          // Fetch additional user data if needed
          setUserData(user)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }

    fetchUserData()
  }, [])
  return (
    <header className={`${darkMode ? 'bg-gray-800/80 backdrop-blur-lg' : 'bg-white/80 backdrop-blur-lg'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} sticky top-0 z-40`}>
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: menu + brand */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-2xl ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors`}
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden bg-white">
              <img src="/INC.png" alt="IncStay Logo" className="w-full h-full object-contain" />
            </div>
            <div className="hidden sm:block">
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>IncStay</h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Housekeeping</p>
            </div>
          </div>
        </div>

        {/* Right: theme, notifications, profile */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-2xl ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors`}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className={`relative p-3 rounded-2xl ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`} aria-label="Notifications">
              <Bell size={20} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center font-semibold">
                {unread}
              </span>
            </button>

            {showNotifications && (
              <div className={`absolute right-0 mt-2 w-80 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-2xl shadow-2xl border overflow-hidden`}>
                <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                </div>
                {items.length === 0 ? (
                  <div className={`px-4 py-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No notifications</div>
                ) : items.map(n => (
                  <div key={n.id} className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-gray-50'} cursor-pointer transition-colors`}>
                    <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{n.msg}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>{n.time}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button onClick={() => setShowProfile(!showProfile)} className={`flex items-center gap-3 px-4 py-2 rounded-2xl ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-semibold">
                {userData?.name ? userData.name.charAt(0).toUpperCase() : 'HK'}
              </div>
              <div className="hidden lg:block text-left">
                <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {userData?.name || 'Housekeeping'}
                </p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {userData?.email || 'Staff'}
                </p>
              </div>
              <ChevronDown size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
            </button>

            {showProfile && (
              <div className={`absolute right-0 mt-2 w-64 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-2xl shadow-2xl border overflow-hidden`}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {userData?.name || 'Housekeeping'}
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {userData?.email || 'contact@namunacollege.edu.np'}
                  </p>
                </div>
                <div className="p-2">
                  <button className={`w-full px-4 py-3 text-left flex items-center gap-3 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                    <User className="w-4 h-4" />
                    <span className={darkMode ? 'text-gray-200' : 'text-gray-700'}>Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      authService.logout()
                      toast.success('Logged out successfully')
                      window.location.href = '/housekeeping/login'
                    }}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 ${darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-50 text-red-600'} transition-colors`}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
