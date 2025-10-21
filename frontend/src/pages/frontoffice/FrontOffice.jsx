import React, { useState } from 'react'
import Header from '../../components/frontoffice/Layout/Header'
import Sidebar from '../../components/frontoffice/Layout/Sidebar'
import Dashboard from '../../components/frontoffice/sections/Dashboard'
import Reservations from '../../components/frontoffice/sections/Reservations'
import RoomStatus from '../../components/frontoffice/sections/RoomStatus'
import CheckInOut from '../../components/frontoffice/sections/CheckInOut'
import Billing from '../../components/frontoffice/sections/Billing'
import Guests from '../../components/frontoffice/sections/Guests'
import NewReservation from '../../components/frontoffice/sections/NewReservation'
import Reports from '../../components/frontoffice/sections/Reports'

const FrontOffice = () => {
  const [darkMode, setDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const sidebarItems = [
    { icon: 'LayoutDashboard', label: 'Dashboard', key: 'dashboard' },
    { icon: 'Users', label: 'Reservations', key: 'reservations' },
    { icon: 'Plus', label: 'New Reservation', key: 'new-reservation' },
    { icon: 'Bed', label: 'Room Status', key: 'rooms' },
    { icon: 'CheckCircle', label: 'Check-in/out', key: 'checkin' },
    { icon: 'CreditCard', label: 'Billing & Payment', key: 'billing' },
    { icon: 'Users', label: 'Guest Profiles', key: 'guests' },
    { icon: 'BarChart3', label: 'Reports', key: 'reports' }
  ]
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 to-blue-50'} font-sans transition-colors duration-300`}>
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        notifications={0}
        searchQuery={''}
        setSearchQuery={() => {}}
      />

      <div className="flex">
        <Sidebar
          darkMode={darkMode}
          sidebarOpen={sidebarOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          items={sidebarItems}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  {sidebarItems.find(i=>i.key===activeTab)?.label}
                </h2>
                <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Staff-facing front office tools
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button className={`flex items-center gap-2 px-6 py-3 rounded-2xl border-2 ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'} transition-colors`}>
                  <span>Export</span>
                </button>
                <button className={`flex items-center gap-2 px-6 py-3 rounded-2xl border-2 ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'} transition-colors`}>
                  <span>Filter</span>
                </button>
              </div>
            </div>
          </div>

          {activeTab==='dashboard' && <Dashboard darkMode={darkMode} />}
          {activeTab==='reservations' && <Reservations />}
          {activeTab==='rooms' && <RoomStatus />}
          {activeTab==='checkin' && <CheckInOut />}
          {activeTab==='billing' && <Billing />}
          {activeTab==='guests' && <Guests />}
          {activeTab==='new-reservation' && <NewReservation />}
          {activeTab==='reports' && <Reports />}
        </main>
      </div>
    </div>
  )
}

export default FrontOffice


