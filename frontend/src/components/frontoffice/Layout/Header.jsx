import React, { useEffect, useMemo, useState } from 'react'
import { Search, X, Sun, Moon, Bell, ChevronDown, Settings, Shield, LogOut, User, Menu } from 'lucide-react'
import { getSocket } from '../../../utils/socket'
import authService from '../../../services/authService'
import { useNavigate } from 'react-router-dom'

const Header = ({ darkMode = false, setDarkMode = () => { }, sidebarOpen = true, setSidebarOpen = () => { }, notifications = 0, searchQuery = '', setSearchQuery = () => { } }) => {
  const [showNotifications, setShowNotifications] = useState(false)
  const [items, setItems] = useState([])
  const unread = useMemo(() => items.filter(i => !i.read).length, [items])
  const navigate = useNavigate()
  const user = authService.getUser()

  useEffect(() => {
    const socket = getSocket()
    const pushItem = (msg) => setItems(prev => [{ id: `${Date.now()}-${Math.random()}`, msg, time: new Date().toLocaleTimeString(), read: false }, ...prev].slice(0, 30))
    const onRoom = (payload) => {
      const room = payload?.room; if (!room) return
      pushItem(`Room #${room.roomNumber} is ${String(room.status).replace('-', ' ')}`)
    }
    const onTask = (payload) => {
      const t = payload?.task
      if (payload?.id) pushItem(`Task #${payload.id} deleted`)
      else if (t) pushItem(`Task: ${t.title} (${t.status})`)
    }
    const onCleaning = (payload, type) => {
      const log = payload?.log; if (!log) return
      if (type === 'start') pushItem(`Cleaning started for room #${log.roomId}`)
      if (type === 'finish') pushItem(`Cleaning finished for room #${log.roomId}`)
    }
    const onBookingCreated = (p) => { const b = p?.booking; if (b) pushItem(`Booking created: #${b.id} for room #${b.roomId}`) }
    const onBookingUpdated = (p) => { const b = p?.booking; if (b) pushItem(`Booking updated: #${b.id} (${b.status})`) }
    const onBookingCancelled = (p) => { const b = p?.booking; if (b) pushItem(`Booking cancelled: #${b.id}`) }
    const onBookingDeleted = (p) => { if (p?.id) pushItem(`Booking deleted: #${p.id}`) }
    socket.on('hk:room:status', onRoom)
    socket.on('hk:task:created', onTask)
    socket.on('hk:task:updated', onTask)
    socket.on('hk:task:deleted', onTask)
    socket.on('hk:cleaning:start', (p) => onCleaning(p, 'start'))
    socket.on('hk:cleaning:finish', (p) => onCleaning(p, 'finish'))
    socket.on('fo:booking:created', onBookingCreated)
    socket.on('fo:booking:updated', onBookingUpdated)
    socket.on('fo:booking:cancelled', onBookingCancelled)
    socket.on('fo:booking:deleted', onBookingDeleted)
    return () => {
      socket.off('hk:room:status', onRoom)
      socket.off('hk:task:created', onTask)
      socket.off('hk:task:updated', onTask)
      socket.off('hk:task:deleted', onTask)
      socket.off('hk:cleaning:start')
      socket.off('hk:cleaning:finish')
      socket.off('fo:booking:created', onBookingCreated)
      socket.off('fo:booking:updated', onBookingUpdated)
      socket.off('fo:booking:cancelled', onBookingCancelled)
      socket.off('fo:booking:deleted', onBookingDeleted)
    }
  }, [])

  useEffect(() => {
    if (showNotifications) setItems(prev => prev.map(i => ({ ...i, read: true })))
  }, [showNotifications])
  return (
    <header className={`${darkMode ? 'bg-gray-800/80 backdrop-blur-lg' : 'bg-white/80 backdrop-blur-lg'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} sticky top-0 z-40`}>
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section - Logo and Menu */}
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
              <img src="/INCHOTEL.png" alt="IncStay Logo" className="w-full h-full object-contain" />
            </div>
            <div className="hidden sm:block">
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>INCHOTEL</h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Front Office</p>
            </div>
          </div>
        </div>

        {/* Centered Search Bar */}
        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} size={20} />
            <input
              type="text"
              placeholder="Search rooms, guests, bookings, reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-2xl border-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'} focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Right Section - Actions and Profile */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-2xl ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors`}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => setShowNotifications(v => !v)} className={`relative p-3 rounded-2xl ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`} aria-label="Notifications">
              <Bell size={20} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
              {(unread || notifications) > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center font-semibold">
                  {unread || notifications}
                </span>
              )}
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

          {/* Profile Dropdown */}
          <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} cursor-pointer transition-colors group relative`}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-semibold">
              FO
            </div>
            <div className="hidden lg:block">
              <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user?.name || 'Front Office'}</p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Staff</p>
            </div>
            <ChevronDown size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />

            {/* Dropdown Menu */}
            <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white">{user?.name || 'Front Office'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email || 'staff@hamrostay.com'}</p>
              </div>
              <div className="p-2">
                {[
                  { icon: User, label: 'Profile' },
                  { icon: Settings, label: 'Settings' },
                  { icon: Shield, label: 'Security' }
                ].map((item, idx) => (
                  <button key={idx} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <item.icon size={18} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                  </button>
                ))}
                <button
                  onClick={() => {
                    authService.logout()
                    navigate('/staff/login')
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors mt-2"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header


