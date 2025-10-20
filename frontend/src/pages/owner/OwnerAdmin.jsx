import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { DollarSign, Hotel, TrendingUp, Users } from 'lucide-react'
import Header from '../../components/owner/Layout/Header'
import Sidebar from '../../components/owner/Layout/Sidebar'
import Dashboard from '../../components/owner/sections/Dashboard'
import Rooms from '../../components/owner/sections/Rooms'

const OwnerAdmin = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
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

  const sidebarItems = useMemo(() => ([
    { icon: 'LayoutDashboard', label: 'Dashboard', key: 'dashboard' },
    { icon: 'Hotel', label: 'Rooms', key: 'rooms' },
    { icon: 'Sparkles', label: 'Facilities', key: 'facilities' },
    { icon: 'Users', label: 'Users', key: 'users' },
    { icon: 'Globe', label: 'OTA Sync', key: 'ota' },
    { icon: 'DollarSign', label: 'Finance', key: 'finance' },
    { icon: 'BarChart3', label: 'Reports', key: 'reports' },
    { icon: 'Settings', label: 'Settings', key: 'settings' }
  ]), [])


  const kpis = useMemo(() => ([
    { label: 'Total Revenue', value: `₹${revenue.toLocaleString()}`, icon: DollarSign, change: '+12.5%', color: 'blue' },
    { label: 'Occupancy Rate', value: `${occupancy}%`, icon: Hotel, change: '+8.2%', color: 'emerald' },
    { label: 'Avg Room Rate', value: `₹${avgRate.toLocaleString()}`, icon: TrendingUp, change: '+5.7%', color: 'purple' },
    { label: 'Staff Productivity', value: `${productivity}%`, icon: Users, change: '+3.1%', color: 'amber' }
  ]), [revenue, occupancy, avgRate, productivity])

  const renderContent = useCallback(() => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard darkMode={darkMode} kpis={kpis} />
      case 'rooms':
        return (
          <Rooms
            darkMode={darkMode}
          />
        )
      default:
        return <Dashboard darkMode={darkMode} kpis={kpis} />
    }
  }, [activeTab, darkMode, kpis])

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 to-blue-50'} font-sans transition-colors duration-300`}>
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
                  {sidebarItems.find(item => item.key === activeTab)?.label}
                </h2>
                <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {activeTab === 'dashboard' && 'Welcome back! Here is your property overview'}
                  {activeTab === 'rooms' && 'Manage all rooms and their availability'}
                  {activeTab === 'facilities' && 'Manage hotel facilities and services'}
                  {activeTab === 'users' && 'Manage staff accounts and permissions'}
                  {activeTab === 'ota' && 'Manage connections with Online Travel Agencies'}
                  {activeTab === 'finance' && 'Track revenue, expenses, and transactions'}
                  {activeTab === 'reports' && 'Generate and view detailed reports'}
                  {activeTab === 'settings' && 'Manage your hotel settings and preferences'}
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

          {renderContent()}
        </main>
      </div>
    </div>
  )
}

export default OwnerAdmin
