import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, Filter, Crown, Star, Users, Eye, Edit, Trash2, XCircle, Check, AlertTriangle } from 'lucide-react'
import { guestService } from '../../../services/guestService'
import Header from '../Layout/Header'
import Sidebar from '../Layout/Sidebar'
import toast from 'react-hot-toast'

const Guests = () => {
  const location = useLocation()
  const [guests, setGuests] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [vipFilter, setVipFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [modalType, setModalType] = useState('')
  const [loading, setLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
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
  const [activeTab, setActiveTab] = useState('guests')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await guestService.getGuests({ page: 1, limit: 20, search: searchQuery })
        // API returns { success, data, total, ... }
        const list = res?.data || []
        // Map optional UI fields for display defaults
        const mapped = list.map(g => ({
          ...g,
          vipStatus: g.vipStatus || 'silver',
          loyaltyPoints: g.loyaltyPoints || 0,
          totalStays: g.bookings?.length || 0,
          lastVisit: g.bookings?.[0]?.createdAt || ''
        }))
        setGuests(mapped)
      } catch (e) {
        console.error('Failed to load guests', e)
        setGuests([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [searchQuery])

  const filtered = useMemo(() => guests.filter(g => {
    const s = searchQuery.toLowerCase()
    const matchesSearch = `${g.firstName} ${g.lastName}`.toLowerCase().includes(s) || g.email.toLowerCase().includes(s) || g.phone.includes(searchQuery)
    const matchesVip = vipFilter === 'all' || g.vipStatus === vipFilter
    return matchesSearch && matchesVip
  }), [guests, searchQuery, vipFilter])

  const vipBadge = (status) => ({ platinum: 'bg-purple-100 text-purple-700', gold: 'bg-yellow-100 text-yellow-700', silver: 'bg-gray-100 text-gray-700', bronze: 'bg-orange-100 text-orange-700' }[status] || 'bg-gray-100 text-gray-700')
  const vipIcon = (status) => status === 'platinum' ? <Crown size={16}/> : <Star size={16}/>

  const open = (type, item) => {
    setModalType(type)
    setSelected(item)
    if (type === 'edit') {
      setEditForm({
        firstName: item.firstName || '',
        lastName: item.lastName || '',
        email: item.email || '',
        phone: item.phone || ''
      })
    }
  }
  const close = () => {
    setModalType('')
    setSelected(null)
    setEditForm({ firstName: '', lastName: '', email: '', phone: '' })
  }

  const handleEdit = async () => {
    if (!selected) return
    try {
      setSaving(true)
      await guestService.updateGuest(selected.id, editForm)
      toast.success('Guest updated successfully')
      // Refresh guests list
      const res = await guestService.getGuests({ page: 1, limit: 20, search: searchQuery })
      const list = res?.data || []
      const mapped = list.map(g => ({
        ...g,
        vipStatus: g.vipStatus || 'silver',
        loyaltyPoints: g.loyaltyPoints || 0,
        totalStays: g.bookings?.length || 0,
        lastVisit: g.bookings?.[0]?.createdAt || ''
      }))
      setGuests(mapped)
      close()
    } catch (e) {
      console.error('Failed to update guest', e)
      toast.error(e.message || 'Failed to update guest')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selected) return
    try {
      setDeleting(true)
      await guestService.deleteGuest(selected.id)
      toast.success('Guest deleted successfully')
      // Remove from local state
      setGuests(prev => prev.filter(g => g.id !== selected.id))
      close()
    } catch (e) {
      console.error('Failed to delete guest', e)
      toast.error(e.message || 'Failed to delete guest')
    } finally {
      setDeleting(false)
    }
  }

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Guest Profiles</h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Name, email, phone" className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">VIP Status</label>
          <select value={vipFilter} onChange={e=>setVipFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All VIP</option>
            <option value="platinum">Platinum</option>
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
            <option value="bronze">Bronze</option>
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={()=>{setSearchQuery('');setVipFilter('all')}} className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Filter size={18}/>Clear</button>
        </div>
      </div>

      {loading && (
        <div className="text-sm text-gray-500">Loading guests...</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(g => (
          <div key={g.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"><Users size={22} className="text-blue-600"/></div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{g.firstName} {g.lastName}</h3>
                  <p className="text-sm text-gray-600">{g.email}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${vipBadge(g.vipStatus)}`}>{vipIcon(g.vipStatus)} {g.vipStatus?.toUpperCase?.() || 'SILVER'}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{g.totalStays}</p>
                <p className="text-xs text-gray-500">Total Stays</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{g.loyaltyPoints}</p>
                <p className="text-xs text-gray-500">Loyalty Points</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Link to={`/frontoffice/guests/${g.id}`} className="flex-1 text-xs bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200">View</Link>
              <button onClick={()=>open('edit', g)} className="flex-1 text-xs bg-green-100 text-green-700 px-3 py-2 rounded hover:bg-green-200">Edit</button>
              <button onClick={()=>open('delete', g)} className="text-xs bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>

      {selected && modalType === 'edit' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Guest</h3>
              <button onClick={close} className="text-gray-400 hover:text-gray-600"><XCircle size={24}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={close} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleEdit} disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? 'Saving...' : 'Save'} {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && modalType === 'delete' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete Guest</h3>
              <button onClick={close} className="text-gray-400 hover:text-gray-600"><XCircle size={24}/></button>
            </div>
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500 mt-0.5" />
              <div>
                <p className="text-gray-900 font-medium">Are you sure you want to delete this guest?</p>
                <p className="text-sm text-gray-600 mt-1">This action cannot be undone. The guest will be permanently removed from the system.</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700"><strong>{selected.firstName} {selected.lastName}</strong></p>
              <p className="text-sm text-gray-600">{selected.email}</p>
              <p className="text-sm text-gray-600">{selected.phone}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={close} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting ? 'Deleting...' : 'Delete'} {deleting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
  const standalone = location.pathname === '/guest/profile'
  if (!standalone) return content
  return (
    <div className={`${darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 to-blue-50'} min-h-screen font-sans transition-colors duration-300`}>
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
          {content}
        </main>
      </div>
    </div>
  )
}

export default Guests
