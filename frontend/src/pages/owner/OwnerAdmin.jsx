import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { DollarSign, Hotel, TrendingUp, Users as UsersIcon } from 'lucide-react'
import Header from '../../components/owner/Layout/Header'
import Sidebar from '../../components/owner/Layout/Sidebar'
import Dashboard from '../../components/owner/sections/Dashboard'
import Rooms from '../../components/owner/sections/Rooms'
import Facilities from '../../components/owner/sections/Facilities'
import ExtraServicesAdmin from '../../components/owner/sections/ExtraServicesAdmin'
import ServiceCategories from '../../components/owner/sections/ServiceCategories'
import Coupons from '../../components/owner/sections/Coupons'
import Users from '../../components/owner/sections/Users'
import Staff from '../../components/owner/sections/Staff'

const OwnerAdmin = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')
  const [notifications] = useState(3)
  const [searchQuery, setSearchQuery] = useState('')

  const [revenue, setRevenue] = useState(0)
  const [occupancy, setOccupancy] = useState(0)
  const [avgRate, setAvgRate] = useState(0)
  const [productivity, setProductivity] = useState(0)
  const [selectedRoom, setSelectedRoom] = useState(null)

  const openModal = useCallback((type) => {
    setModalType(type)
    setShowModal(true)
  }, [])

  const closeModal = useCallback(() => {
    setShowModal(false)
    setModalType('')
  }, [])

  useEffect(() => {
    const animateCounter = (setter, target, duration = 2000) => {
      const start = 0
      const increment = target / (duration / 16)
      let current = start
      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          setter(target)
          clearInterval(timer)
        } else {
          setter(Math.floor(current))
        }
      }, 16)
      return () => clearInterval(timer)
    }

    if (activeTab === 'dashboard') {
      animateCounter(setRevenue, 2450000)
      animateCounter(setOccupancy, 87)
      animateCounter(setAvgRate, 8500)
      animateCounter(setProductivity, 94)
    }
  }, [activeTab])

  // Route mapping for tabs that have dedicated routes
  useEffect(() => {
    if (activeTab === 'ota') {
      navigate('/owner-admin/ota')
    } else if (activeTab === 'facilities') {
      navigate('/owner-admin/facilities')
    } else if (activeTab === 'extra-services') {
      navigate('/owner-admin/extra-services')
    } else if (activeTab === 'service-categories') {
      navigate('/owner-admin/service-categories')
    } else if (activeTab === 'coupons') {
      navigate('/owner-admin/coupons')
    }
    else if (activeTab === 'staff') {
      navigate("/owner-admin/staff")
    }
    else if (activeTab === 'rooms') {
      navigate('/owner-admin/owneroom')
    }
    // Add more route mappings here as new child routes are introduced
  }, [activeTab, navigate])

  // Keep tab highlight in sync when navigating directly or via browser controls
  useEffect(() => {
    const path = location.pathname
    if (path.startsWith('/owner-admin/ota')) setActiveTab('ota')
    else if (path.startsWith('/owner-admin/owneroom')) setActiveTab('rooms')
    else if (path.startsWith('/owner-admin/facilities')) setActiveTab('facilities')
    else if (path.startsWith('/owner-admin/extra-services')) setActiveTab('extra-services')
    else if (path.startsWith('/owner-admin/service-categories')) setActiveTab('service-categories')
    else if (path.startsWith('/owner-admin/coupons')) setActiveTab('coupons')
    else if (path.startsWith('/owner-admin/users')) setActiveTab('users')
    else if (path.startsWith('/owner-admin/staff')) setActiveTab('staff')
    else if (path.startsWith('/owner-admin')) setActiveTab('dashboard')
  }, [location.pathname])

  const sidebarItems = useMemo(() => ([
    { icon: 'LayoutDashboard', label: 'Dashboard', key: 'dashboard', route: '/owner-admin/dashboard' },
    { icon: 'Hotel', label: 'Rooms', key: 'rooms', route: '/owner-admin/owneroom' },
    { icon: 'Sparkles', label: 'Facilities', key: 'facilities', route: '/owner-admin/facilities' },
    { icon: 'Package', label: 'Extra Services', key: 'extra-services', route: '/owner-admin/extra-services' },
    { icon: 'Tags', label: 'Service Categories', key: 'service-categories', route: '/owner-admin/service-categories' },
    { icon: 'Ticket', label: 'Coupons', key: 'coupons', route: '/owner-admin/coupons' },
    { icon: 'Users', label: 'Users', key: 'users', route: '/owner-admin/users' },
    { icon: 'Users', label: 'Staff', key: 'staff', route: '/owner-admin/staff' },

    { icon: 'DollarSign', label: 'Finance', key: 'finance' },
    { icon: 'BarChart3', label: 'Reports', key: 'reports' },
    { icon: 'Settings', label: 'Settings', key: 'settings' }
  ]), [])

  const kpis = useMemo(() => ([
    { label: 'Total Revenue', value: `₹${revenue.toLocaleString()}`, icon: DollarSign, change: '+12.5%', color: 'blue' },
    { label: 'Occupancy Rate', value: `${occupancy}%`, icon: Hotel, change: '+8.2%', color: 'emerald' },
    { label: 'Avg Room Rate', value: `₹${avgRate.toLocaleString()}`, icon: TrendingUp, change: '+5.7%', color: 'purple' },
    { label: 'Staff Productivity', value: `${productivity}%`, icon: UsersIcon, change: '+3.1%', color: 'amber' }
  ]), [revenue, occupancy, avgRate, productivity])

  const renderContent = useCallback(() => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard darkMode={darkMode} kpis={kpis} />
      case 'rooms':
        return (
          <Rooms
            darkMode={darkMode}
            onSelectRoom={setSelectedRoom}
          />
        )
      case 'facilities':
        return (
          <Facilities
            darkMode={darkMode}
          />
        )
      case 'extra-services':
        return (
          <ExtraServicesAdmin
            darkMode={darkMode}
          />
        )
      case 'coupons':
        return (
          <Coupons
            darkMode={darkMode}
          />
        )
      case 'users':
        return (
          <Users
            darkMode={darkMode}
          />
        )
      case 'staff':
        return (
          <Staff
            darkMode={darkMode}
          />
        )
      default:
        return <Dashboard darkMode={darkMode} kpis={kpis} />
    }
  }, [activeTab, darkMode, kpis])

  const isBaseAdmin = location.pathname === '/owner-admin'

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 to-blue-50'} font-sans transition-colors duration-300`}>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} w-full max-w-lg rounded-2xl p-6 border`}>
            <div className="flex items-center justify-between mb-4">
              <p className={`${darkMode ? 'text-white' : 'text-gray-900'} font-semibold`}>Create {modalType}</p>
              <button onClick={closeModal} className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>✕</button>
            </div>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>This is a placeholder modal. Integrate your form here.</p>
          </div>
        </div>
      )}

      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        notifications={notifications}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          darkMode={darkMode}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          items={sidebarItems}
          selectedRoom={selectedRoom}
        />

        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
          <div className="mb-4 sm:mb-6 md:mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1 sm:mb-2`}>
                  {sidebarItems.find(item => item.key === activeTab)?.label}
                </h2>
                <p className={`text-sm sm:text-base md:text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {activeTab === 'dashboard' && 'Welcome back! Here is your property overview'}
                  {activeTab === 'rooms' && 'Manage all rooms and their availability'}
                  {activeTab === 'facilities' && 'Manage hotel facilities and services'}
                  {activeTab === 'extra-services' && 'Manage additional services offered to guests'}
                  {activeTab === 'coupons' && 'Create and manage discount coupons for bookings'}
                  {activeTab === 'users' && 'Manage registered users and their account information'}
                  {activeTab === 'staff' && 'Manage front office staff members'}
                  {activeTab === 'ota' && 'Manage connections with Online Travel Agencies'}
                  {activeTab === 'finance' && 'Track revenue, expenses, and transactions'}
                  {activeTab === 'reports' && 'Generate and view detailed reports'}
                  {activeTab === 'settings' && 'Manage your hotel settings and preferences'}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 md:gap-3">
                <button className={`flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl border-2 text-sm md:text-base ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'} transition-colors`}>
                  <span>Export</span>
                </button>
                <button className={`flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl border-2 text-sm md:text-base ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'} transition-colors`}>
                  <span>Filter</span>
                </button>
              </div>
            </div>
          </div>

          {isBaseAdmin ? renderContent() : <Outlet />}
        </main>
      </div>
    </div>
  )
}

export default OwnerAdmin
