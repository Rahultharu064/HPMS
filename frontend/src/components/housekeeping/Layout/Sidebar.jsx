import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Eye, Calendar, Users, Settings } from 'lucide-react'

const Sidebar = ({ darkMode, sidebarOpen, setSidebarOpen }) => {
  const items = [
    { to: '/housekeeping/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/housekeeping/rooms', icon: Eye, label: 'Room Status' },
    { to: '/housekeeping/schedule', icon: Calendar, label: 'Schedule' },
    { to: '/housekeeping/staff', icon: Users, label: 'Staff Assignment' },
    { to: '/housekeeping/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative left-0 top-0 h-screen lg:h-auto w-64 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'} border-r p-6 transition-transform duration-300 z-30 lg:z-auto pt-24 lg:pt-6`}>
      <nav className="space-y-2">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                : darkMode
                  ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
