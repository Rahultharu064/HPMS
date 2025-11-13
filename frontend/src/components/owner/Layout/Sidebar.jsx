import React from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Hotel, Sparkles, Users, Globe, DollarSign, BarChart3, Settings, Package } from 'lucide-react'

const iconMap = { LayoutDashboard, Hotel, Sparkles, Users, Globe, DollarSign, BarChart3, Settings, Package }

const Sidebar = ({ darkMode, sidebarOpen, activeTab, setActiveTab, items, selectedRoom }) => {
  const navigate = useNavigate()
  const [openFeatures, setOpenFeatures] = React.useState(true)
  return (
    <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky top-0 left-0 h-screen ${darkMode ? 'bg-gray-800/80 backdrop-blur-lg' : 'bg-white/80 backdrop-blur-lg'} border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${sidebarOpen ? 'w-80 lg:w-80' : 'w-80 lg:w-20'} transition-all duration-300 z-30 pt-20 lg:pt-0`}>
      <div className={`${sidebarOpen ? 'p-6' : 'p-3'} h-full overflow-y-auto`}>
        <nav className="space-y-2">
          {items.map((item) => {
            const Icon = iconMap[item.icon]
            return (
              <button
                key={item.key}
                onClick={() => { setActiveTab(item.key); if (item.route) navigate(item.route) }}
                className={`w-full flex items-center ${sidebarOpen ? 'gap-4 justify-start' : 'gap-0 justify-center'} px-4 py-4 rounded-2xl transition-all ${
                  activeTab === item.key
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                    : darkMode
                      ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={22} />
                {sidebarOpen && <span className="font-semibold text-lg">{item.label}</span>}
              </button>
            )
          })}
        </nav>
        {selectedRoom && (
          <div className={`mt-6 rounded-2xl border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} overflow-hidden`}>
            <button
              onClick={() => setOpenFeatures(v => !v)}
              className={`w-full flex items-center justify-between px-4 py-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              <span className="font-semibold">Room Features</span>
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{openFeatures ? 'Hide' : 'Show'}</span>
            </button>
            {openFeatures && (
              <div className="px-4 pb-4 space-y-3">
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
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
                      {selectedRoom.amenity.slice(0, 12).map((a, i) => (
                        <span key={i} className={`px-2 py-1 rounded-full text-xs border ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}>{a.name}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
