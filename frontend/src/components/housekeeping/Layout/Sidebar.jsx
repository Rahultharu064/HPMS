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
    <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky top-0 left-0 h-screen ${darkMode ? 'bg-gray-800/80 backdrop-blur-lg' : 'bg-white/80 backdrop-blur-lg'} border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${sidebarOpen ? 'w-80 lg:w-80' : 'w-80 lg:w-20'} transition-all duration-300 z-30 pt-20 lg:pt-0`}>
      <div className={`${sidebarOpen ? 'p-6' : 'p-3'} h-full overflow-y-auto`}>
        <nav className="space-y-2">
          {items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `w-full flex items-center ${sidebarOpen ? 'gap-4 justify-start' : 'gap-0 justify-center'} px-4 py-4 rounded-2xl transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                  : darkMode
                    ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {sidebarOpen && <span className="font-semibold text-lg">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar
