import React from 'react'
import { Bell, ChevronDown, Menu, Moon, Sun, LogOut, User } from 'lucide-react'

const Header = ({ darkMode, setDarkMode, showNotifications, setShowNotifications, showProfile, setShowProfile, sidebarOpen, setSidebarOpen }) => {
  return (
    <nav className={`sticky top-0 z-40 ${darkMode ? 'bg-gray-900/80 backdrop-blur-xl border-gray-800' : 'bg-white/80 backdrop-blur-xl'} border-b shadow-sm transition-all duration-300`}>
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`lg:hidden p-2 rounded-xl ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="text-3xl">🏨</div>
            <div>
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Grand Hotel</h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Housekeeping Shift</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setDarkMode(!darkMode)} className={`p-2.5 rounded-xl ${darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-all`}>
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className={`relative p-2.5 rounded-xl ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-all`}>
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
                2
              </span>
            </button>

            {showNotifications && (
              <div className={`absolute right-0 mt-2 w-80 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-2xl shadow-2xl border overflow-hidden`}>
                <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                </div>
                {[{id:1,msg:'Checkout soon: 204',time:'5m'},{id:2,msg:'Room 305 cleaned',time:'10m'}].map(n => (
                  <div key={n.id} className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-gray-50'} cursor-pointer transition-colors`}>
                    <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{n.msg}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>{n.time}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg transition-all">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">SJ</div>
              <span className="font-medium">Sarah Johnson</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showProfile && (
              <div className={`absolute right-0 mt-2 w-48 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-2xl shadow-2xl border overflow-hidden`}>
                <button className={`w-full px-4 py-3 text-left flex items-center gap-3 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                  <User className="w-4 h-4" />
                  <span className={darkMode ? 'text-gray-200' : 'text-gray-700'}>Settings</span>
                </button>
                <button className={`w-full px-4 py-3 text-left flex items-center gap-3 ${darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-50 text-red-600'} transition-colors`}>
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Header
