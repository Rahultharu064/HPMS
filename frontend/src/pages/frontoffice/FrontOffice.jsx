import React, { useMemo, useState } from 'react'
import Header from '../../components/frontoffice/Layout/Header'
import Sidebar from '../../components/frontoffice/Layout/Sidebar'
import Dashboard from '../../components/frontoffice/sections/Dashboard'
import Reservations from '../../components/frontoffice/sections/Reservations'
import RoomStatus from '../../components/frontoffice/sections/RoomStatus'
import RoomAvailability from '../../components/frontoffice/sections/RoomAvailability'
import CheckInOut from '../../components/frontoffice/sections/CheckInOut'
import Billing from '../../components/frontoffice/sections/Billing'
import Guests from '../../components/frontoffice/sections/Guests'
import Reports from '../../components/frontoffice/sections/Reports'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const FrontOffice = () => {
  const [darkMode, setDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const sidebarItems = useMemo(() => ([
    { icon: 'LayoutDashboard', label: 'Dashboard', key: 'dashboard', path: '/front-office/dashboard' },
    { icon: 'ShoppingBag', label: 'Services', key: 'services', path: '/front-office/services' },
    { icon: 'Users', label: 'Reservations', key: 'reservations', path: '/front-office/reservations' },
    { icon: 'Bed', label: 'Room Status', key: 'rooms', path: '/front-office/rooms' },
    { icon: 'Bed', label: 'Room Availability', key: 'room-availability', path: '/front-office/room-availability' },
    { icon: 'CheckCircle', label: 'Check-in/out', key: 'checkin', path: '/front-office/checkin' },
    { icon: 'FileText', label: 'Guest Folio', key: 'folio', path: '/front-office/folio' },
    { icon: 'CreditCard', label: 'Billing & Payment', key: 'billing', path: '/front-office/billing' },
    { icon: 'Users', label: 'Guest Profiles', key: 'guests', path: '/front-office/guests' },
    { icon: 'BarChart3', label: 'Reports', key: 'reports', path: '/front-office/reports' }
  ]), [])

  const activeTab = useMemo(() => {
    const current = sidebarItems.find(i => location.pathname.startsWith(i.path))
    return current?.key || 'dashboard'
  }, [location.pathname, sidebarItems])

  const setActiveTab = (key) => {
    const target = sidebarItems.find(i => i.key === key)
    if (target) navigate(target.path)
  }

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 to-blue-50'} font-sans transition-colors duration-300`}>
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        notifications={0}
        searchQuery={searchQuery}
        setSearchQuery={(val) => {
          setSearchQuery(val)
          const q = val?.trim()
          if (q) {
            navigate(`/front-office/reservations?q=${encodeURIComponent(q)}`)
          } else if (location.pathname.startsWith('/front-office/reservations')) {
            navigate('/front-office/reservations')
          }
        }}
      />

      <div className="flex flex-1 overflow-hidden">
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
                  {sidebarItems.find(i => i.key === activeTab)?.label}
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
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default FrontOffice


