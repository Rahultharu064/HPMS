import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import Header from '../Layout/Header'
import Sidebar from '../Layout/Sidebar'
import { guestService } from '../../../services/guestService'
import toast from 'react-hot-toast'
import {
  User, Edit3, FileText, Download, Phone, Mail, MapPin, Star,
  TrendingUp, Plus, Send, Printer, Award, ChevronRight, Eye, X, Check,
  Image as ImageIcon
} from 'lucide-react'

export default function GuestProfilePage() {
  const { id } = useParams()
  const numericId = Number(id)
  const isValidId = Number.isFinite(numericId) && numericId > 0

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [guest, setGuest] = useState(null)
  const [bookings, setBookings] = useState([])

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const photoInputRef = useRef(null)

  const [viewMode, setViewMode] = useState('table')
  const [reservationFilter, setReservationFilter] = useState('all') // all|active|past|canceled

  const [darkMode, setDarkMode] = useState(false)
  const [frontSidebarOpen, setFrontSidebarOpen] = useState(true)
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
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        if (!isValidId) {
          setError('Invalid guest id')
          return
        }
        const [g, b] = await Promise.all([
          guestService.getGuest(numericId),
          guestService.getGuestBookings(numericId)
        ])
        if (!mounted) return
        setGuest(g.guest ?? g)
        setForm(prev => ({
          ...prev,
          firstName: g.guest?.firstName ?? g.firstName,
          lastName: g.guest?.lastName ?? g.lastName,
          email: g.guest?.email ?? g.email,
          phone: g.guest?.phone ?? g.phone,
          nationality: g.guest?.nationality ?? g.nationality ?? '',
          idType: g.guest?.idType ?? g.idType ?? 'Citizenship',
          idNumber: g.guest?.idNumber ?? g.idNumber ?? '',
          address: g.guest?.address ?? g.address ?? '',
          notes: g.guest?.notes ?? g.notes ?? ''
        }))
        setBookings(b.data ?? b.bookings ?? [])
      } catch (e) {
        console.error(e)
        setError(e.message || 'Failed to load guest')
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [numericId, isValidId])

  const displayName = useMemo(() => {
    if (!guest) return ''
    return `${guest.firstName} ${guest.lastName}`.trim()
  }, [guest])

  const initials = useMemo(() => {
    const parts = displayName.split(' ').filter(Boolean)
    return parts.slice(0,2).map(p => p[0]).join('').toUpperCase() || 'G'
  }, [displayName])

  const insights = guest?.insights ?? {}

  const filteredReservations = useMemo(() => {
    if (!Array.isArray(bookings)) return []
    if (reservationFilter === 'all') return bookings
    if (reservationFilter === 'active') return bookings.filter(b => ['pending','confirmed','checked-in','checkedin','confirmed'].includes(String(b.status).toLowerCase()))
    if (reservationFilter === 'past') return bookings.filter(b => ['checked-out','checkedout','completed'].includes(String(b.status).toLowerCase()))
    if (reservationFilter === 'canceled' || reservationFilter === 'cancelled') return bookings.filter(b => ['canceled','cancelled'].includes(String(b.status).toLowerCase()))
    return bookings
  }, [bookings, reservationFilter])

  const handleEditToggle = async () => {
    if (!isEditing) {
      setIsEditing(true)
      return
    }
    try {
      setSaving(true)
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        nationality: form.nationality,
        idType: form.idType,
        idNumber: form.idNumber,
        address: form.address,
        notes: form.notes
      }
      await guestService.updateGuest(numericId, payload)
      toast.success('Guest updated')
      setIsEditing(false)
      // refresh
      const g = await guestService.getGuest(numericId)
      setGuest(g.guest ?? g)
    } catch (e) {
      console.error(e)
      toast.error(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const onPhotoClick = () => photoInputRef.current?.click()
  const onPhotoSelected = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      if (!isValidId) {
        toast.error('Invalid guest id')
        return
      }
      await guestService.uploadPhoto(numericId, file)
      toast.success('Photo updated')
      const g = await guestService.getGuest(numericId)
      setGuest(g.guest ?? g)
    } catch (err) {
      console.error(err)
      toast.error('Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'confirmed': 'bg-green-100 text-green-700',
      'checked-in': 'bg-blue-100 text-blue-700',
      'checkedin': 'bg-blue-100 text-blue-700',
      'checked-out': 'bg-purple-100 text-purple-700',
      'checkedout': 'bg-purple-100 text-purple-700',
      'cancelled': 'bg-red-100 text-red-700',
      'canceled': 'bg-red-100 text-red-700'
    }
    return colors[String(status).toLowerCase()] || 'bg-gray-100 text-gray-700'
  }

  if (!isValidId) return <Navigate to="/guest/profile" replace />
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading guest...</div>
  if (error) return (
    <div className={`${darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 to-blue-50'} min-h-screen font-sans transition-colors duration-300`}>
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        sidebarOpen={frontSidebarOpen}
        setSidebarOpen={setFrontSidebarOpen}
        notifications={0}
        searchQuery={''}
        setSearchQuery={() => {}}
      />
      <div className="flex">
        <Sidebar
          darkMode={darkMode}
          sidebarOpen={frontSidebarOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          items={sidebarItems}
        />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center">
            <div className="bg-white border border-red-200 text-red-700 rounded-xl p-6 shadow-sm text-center">
              <div className="text-lg font-semibold mb-2">{error}</div>
              <div className="text-sm text-gray-600 mb-4">Please open a guest from the list to view their profile.</div>
              <Link to="/guest/profile" className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-900 text-white hover:bg-blue-800">
                Go to Guests
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
  if (!guest) return null

  return (
    <div className={`${darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 to-blue-50'} min-h-screen font-sans transition-colors duration-300`}>
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        sidebarOpen={frontSidebarOpen}
        setSidebarOpen={setFrontSidebarOpen}
        notifications={0}
        searchQuery={''}
        setSearchQuery={() => {}}
      />
      <div className="flex">
        <Sidebar
          darkMode={darkMode}
          sidebarOpen={frontSidebarOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          items={sidebarItems}
        />
        <main className="flex-1 p-6 overflow-y-auto">
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Guest Profile</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <Link to="/front-office" className="hover:text-gray-700">Dashboard</Link>
              <ChevronRight className="w-4 h-4" />
              <Link to="/guest/profile" className="hover:text-gray-700">Guests</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-blue-900 font-medium">Guest Profile</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200">
              <Download className="w-4 h-4" />
              <span className="font-medium">Export</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200">
              <FileText className="w-4 h-4" />
              <span className="font-medium">View Folio</span>
            </button>
            <button onClick={handleEditToggle} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition-all duration-200 disabled:opacity-50">
              {isEditing ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              <span className="font-medium">{isEditing ? 'Save' : 'Edit Profile'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Guest Info Card */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6 hover:shadow-md transition-all duration-200">
              <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  {guest.photoUrl ? (
                    <img src={guest.photoUrl} alt={displayName} className="w-32 h-32 rounded-full object-cover shadow-lg" />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                      {initials}
                    </div>
                  )}
                  <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={onPhotoSelected} />
                  <button onClick={onPhotoClick} disabled={uploading} className="mt-3 text-xs text-blue-900 hover:text-blue-700 font-medium flex items-center gap-1 disabled:opacity-50">
                    <ImageIcon className="w-3.5 h-3.5" /> {uploading ? 'Uploading...' : 'Upload New Photo'}
                  </button>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">{displayName}</h2>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-4 py-1.5 bg-yellow-400 text-yellow-900 rounded-full text-sm font-semibold flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          {guest.loyaltyLevel || 'Silver'}
                        </span>
                        {guest.vip && (
                          <span className="px-4 py-1.5 bg-blue-900 text-white rounded-full text-sm font-semibold flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            VIP Guest
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-6 mt-6">
                    <div className="bg-white px-4 py-3 rounded-xl border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Member Since</div>
                      <div className="text-lg font-bold text-gray-900">{insights.memberSince ? new Date(insights.memberSince).toLocaleDateString() : '-'}</div>
                    </div>
                    <div className="bg-white px-4 py-3 rounded-xl border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Total Nights</div>
                      <div className="text-lg font-bold text-gray-900">{insights.totalNights ?? 0}</div>
                    </div>
                    <div className="bg-white px-4 py-3 rounded-xl border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Total Spend</div>
                      <div className="text-lg font-bold text-gray-900">NPR {Number(insights.totalSpend || 0).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact & Identity Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Contact Information</h3>
                <button 
                  onClick={handleEditToggle}
                  disabled={saving}
                  className="text-sm text-blue-900 hover:text-blue-700 font-medium flex items-center gap-1 disabled:opacity-50"
                >
                  {isEditing ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  {isEditing ? 'Save' : 'Edit'}
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <User className="w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={`${form.firstName ?? ''} ${form.lastName ?? ''}`}
                      onChange={(e) => {
                        const parts = e.target.value.split(' ')
                        setForm(f => ({ ...f, firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') }))
                      }}
                      disabled={!isEditing}
                      className="flex-1 bg-transparent outline-none text-gray-900"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <input 
                      type="email" 
                      value={form.email ?? ''}
                      onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                      disabled={!isEditing}
                      className="flex-1 bg-transparent outline-none text-gray-900"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <input 
                      type="tel" 
                      value={form.phone ?? ''}
                      onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                      disabled={!isEditing}
                      className="flex-1 bg-transparent outline-none text-gray-900"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={form.nationality ?? ''}
                      onChange={(e) => setForm(f => ({ ...f, nationality: e.target.value }))}
                      disabled={!isEditing}
                      className="flex-1 bg-transparent outline-none text-gray-900"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ID Type</label>
                  <select 
                    disabled={!isEditing}
                    value={form.idType ?? 'Citizenship'}
                    onChange={(e) => setForm(f => ({ ...f, idType: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-gray-900"
                  >
                    <option>Citizenship</option>
                    <option>Passport</option>
                    <option>Driving License</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ID Number</label>
                  <input 
                    type="text" 
                    value={form.idNumber ?? ''}
                    onChange={(e) => setForm(f => ({ ...f, idNumber: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-gray-900"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={form.address ?? ''}
                      onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                      disabled={!isEditing}
                      className="flex-1 bg-transparent outline-none text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences & Notes */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Preferences & Notes</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🛏️ Favorite Room Type</label>
                    <select value={form.favoriteRoomType ?? ''} onChange={(e)=>setForm(f=>({...f,favoriteRoomType:e.target.value}))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-gray-900">
                      <option value="">Select...</option>
                      <option>Standard Room</option>
                      <option>Deluxe Room</option>
                      <option>Executive Suite</option>
                      <option>Presidential Suite</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">💳 Preferred Payment</label>
                    <select value={form.preferredPayment ?? ''} onChange={(e)=>setForm(f=>({...f,preferredPayment:e.target.value}))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-gray-900">
                      <option value="">Select...</option>
                      <option>Cash</option>
                      <option>Card</option>
                      <option>Khalti</option>
                      <option>eSewa</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📱 Communication Preference</label>
                    <select value={form.communicationPreference ?? ''} onChange={(e)=>setForm(f=>({...f,communicationPreference:e.target.value}))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-gray-900">
                      <option value="">Select...</option>
                      <option>Email</option>
                      <option>SMS</option>
                      <option>Call</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📝 Special Notes</label>
                  <textarea 
                    rows="8"
                    value={form.notes ?? ''}
                    onChange={(e)=>setForm(f=>({...f,notes:e.target.value}))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-gray-900 resize-none"
                    placeholder="Special requests, allergies, feedback..."
                  ></textarea>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-sm border border-blue-200 p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-blue-900" />
                <h3 className="text-lg font-bold text-gray-900">Insights</h3>
              </div>
              <p className="text-gray-700">This guest prefers <span className="font-semibold">{form.favoriteRoomType || 'Deluxe Rooms'}</span> and tends to book <span className="font-semibold">3-night stays</span>. Consider a loyalty perk.</p>
            </div>

            {/* Past Stays */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Past Stays</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setViewMode('table')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'table' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Table View
                  </button>
                  <button 
                    onClick={() => setViewMode('card')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'card' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Card View
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Stay Dates</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Room Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Room No.</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Total Spend</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                        <td className="py-4 px-4 text-sm text-gray-900">{new Date(b.checkIn).toLocaleDateString()} - {new Date(b.checkOut).toLocaleDateString()}</td>
                        <td className="py-4 px-4 text-sm text-gray-900">{b.room?.roomType || '-'}</td>
                        <td className="py-4 px-4 text-sm text-gray-900 font-medium">{b.room?.roomNumber || '-'}</td>
                        <td className="py-4 px-4 text-sm text-gray-900">NPR {Number(b.totalAmount || 0).toLocaleString()}</td>
                        <td className="py-4 px-4 text-sm">
                          <div className="text-gray-500">—</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Linked Reservations */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Linked Reservations</h3>
                <div className="flex gap-2">
                  <button onClick={() => setReservationFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium ${reservationFilter==='all'?'bg-blue-900 text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>All</button>
                  <button onClick={() => setReservationFilter('active')} className={`px-4 py-2 rounded-lg text-sm font-medium ${reservationFilter==='active'?'bg-blue-900 text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Active</button>
                  <button onClick={() => setReservationFilter('past')} className={`px-4 py-2 rounded-lg text-sm font-medium ${reservationFilter==='past'?'bg-blue-900 text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Past</button>
                  <button onClick={() => setReservationFilter('canceled')} className={`px-4 py-2 rounded-lg text-sm font-medium ${reservationFilter==='canceled'?'bg-blue-900 text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Canceled</button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Reservation No</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Check-in</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Check-out</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Room Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReservations.map((b) => (
                      <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 text-sm font-medium text-blue-900">RES-{b.id}</td>
                        <td className="py-4 px-4 text-sm text-gray-900">{new Date(b.checkIn).toLocaleDateString()}</td>
                        <td className="py-4 px-4 text-sm text-gray-900">{new Date(b.checkOut).toLocaleDateString()}</td>
                        <td className="py-4 px-4 text-sm text-gray-900">{b.room?.roomType || '-'}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(b.status)}`}>
                            {String(b.status).replace('-', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex justify-end gap-2">
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="View">
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Modify">
                              <Edit3 className="w-4 h-4 text-gray-600" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Cancel">
                              <X className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-fit sticky top-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-3 mb-6">
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition-all">
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add Booking</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all">
                <FileText className="w-5 h-5" />
                <span className="font-medium">Add Note</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all">
                <Send className="w-5 h-5" />
                <span className="font-medium">Send Payment Link</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all">
                <Printer className="w-5 h-5" />
                <span className="font-medium">Print Summary</span>
              </button>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Guest Insights</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs text-gray-500 mb-1">Average Spend per Stay</div>
                  <div className="text-2xl font-bold text-gray-900">NPR {(() => {
                    const total = insights.totalSpend || 0
                    const stays = bookings.length || 1
                    return Number(total / stays).toLocaleString()
                  })()}</div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs text-gray-500 mb-1">Average Stay Duration</div>
                  <div className="text-2xl font-bold text-gray-900">{(() => {
                    const nights = insights.totalNights || 0
                    const stays = bookings.length || 1
                    return (nights / stays).toFixed(1)
                  })()} nights</div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs text-gray-500 mb-1">Most Booked Room</div>
                  <div className="text-lg font-bold text-gray-900">{(() => {
                    const map = new Map()
                    for (const b of bookings) {
                      const type = b.room?.roomType || '—'
                      map.set(type, (map.get(type) || 0) + 1)
                    }
                    let best = '—', max = 0
                    for (const [k,v] of map) if (v>max) { best=k; max=v }
                    return best
                  })()}</div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs text-gray-500 mb-1">Last Visit</div>
                  <div className="text-lg font-bold text-gray-900">{bookings[0]?.checkOut ? new Date(bookings[0].checkOut).toLocaleDateString() : '—'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between text-sm text-gray-500 pb-4">
          <div>Last updated: {new Date(guest.updatedAt || guest.createdAt || Date.now()).toLocaleString()}</div>
          <Link to="/guest/profile" className="text-blue-900 hover:text-blue-700 font-medium flex items-center gap-1">
            View All Guests
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
        </div>
        </main>
      </div>
    </div>
  )
}
