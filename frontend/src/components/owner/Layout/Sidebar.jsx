import React from 'react'
import { LayoutDashboard, Hotel, Sparkles, Users, Globe, DollarSign, BarChart3, Settings } from 'lucide-react'

const iconMap = { LayoutDashboard, Hotel, Sparkles, Users, Globe, DollarSign, BarChart3, Settings }

const Sidebar = ({ darkMode, sidebarOpen, activeTab, setActiveTab, items }) => {
  return (
    <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky top-0 left-0 h-screen ${darkMode ? 'bg-gray-800/80 backdrop-blur-lg' : 'bg-white/80 backdrop-blur-lg'} border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'} w-80 transition-transform duration-300 z-30 pt-20 lg:pt-0`}>
      <div className="p-6">
        <nav className="space-y-2">
          {items.map((item) => {
            const Icon = iconMap[item.icon]
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${
                  activeTab === item.key
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                    : darkMode
                      ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={22} />
                <span className="font-semibold text-lg">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar
