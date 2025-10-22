import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Search, RefreshCw, Store, Circle } from 'lucide-react'
import { facilityService } from '../../../services/facilityService'
import { buildMediaUrl } from '../../../utils/media'

const Facilities = ({ darkMode }) => {
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ search: '', category: '', status: '' })
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    openingHours: '',
    status: 'open',
    images: []
  })

  const fetchFacilities = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const query = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v && v !== 'all')
      )
      const res = await facilityService.getFacilities(query)
      setFacilities(res.data || [])
    } catch (e) {
      setError(e.message || 'Failed to load facilities')
      setFacilities(res => res) // keep existing
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchFacilities()
  }, [fetchFacilities])

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-blue-100'}`}>
            <Store className={darkMode ? 'text-blue-300' : 'text-blue-600'} size={20} />
          </div>
          <div>
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Facilities</h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage hotel-wide facilities and amenities</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchFacilities} className={`flex items-center gap-2 px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg">
            <Plus size={16} /> New Facility
          </button>
        </div>
      </div>

      <div className={`rounded-2xl p-4 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow'}`}>
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className={`w-full pl-9 pr-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200'}`}
              placeholder="Search facilities..."
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            />
          </div>
          <select
            className={`px-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200'}`}
            value={filters.category || 'all'}
            onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
          >
            <option value="all">All Categories</option>
            <option value="Wellness">Wellness</option>
            <option value="Fitness">Fitness</option>
            <option value="Recreation">Recreation</option>
            <option value="Dining">Dining</option>
            <option value="Business">Business</option>
          </select>
          <select
            className={`px-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200'}`}
            value={filters.status || 'all'}
            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {loading && <div className="py-10 text-center text-gray-500">Loading facilities...</div>}
        {error && !loading && <div className="py-4 text-red-500 text-sm">{error}</div>}

        {!loading && facilities.length === 0 && (
          <div className="py-10 text-center text-gray-500">No facilities found</div>
        )}

        {!loading && facilities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {facilities.map((f) => (
              <div key={f.id} className={`rounded-xl overflow-hidden border ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                <div className="h-40 bg-gray-100">
                  <img src={buildMediaUrl(f.images?.[0]?.url) || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'} alt={f.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{f.name}</h4>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm line-clamp-2`}>{f.description}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Circle size={10} className={f.status === 'open' ? 'text-green-500' : 'text-gray-400'} />
                      <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{f.status}</span>
                    </div>
                  </div>
                  <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-xs mt-2`}>{f.openingHours || 'Hours: N/A'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'} w-full max-w-xl rounded-2xl p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Create Facility</h4>
              <button onClick={() => setShowCreate(false)} className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>✕</button>
            </div>

            {error && <div className="text-red-500 text-sm mb-3">{error}</div>}

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300'}`}
                  placeholder="e.g., Spa & Wellness"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={4}
                  className={`w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300'}`}
                  placeholder="Short description"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300'}`}
                  >
                    <option value="">Select</option>
                    <option value="Wellness">Wellness</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Recreation">Recreation</option>
                    <option value="Dining">Dining</option>
                    <option value="Business">Business</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300'}`}
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Opening Hours</label>
                  <input
                    value={form.openingHours}
                    onChange={(e) => setForm(f => ({ ...f, openingHours: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300'}`}
                    placeholder="Mon-Sun 08:00-20:00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Images (max 10)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setForm(f => ({ ...f, images: Array.from(e.target.files || []) }))}
                  className={`w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className={`${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-4 py-2 rounded-xl`}>Cancel</button>
              <button
                disabled={saving}
                onClick={async () => {
                  if (!form.name || !form.description) {
                    return setError('Name and description are required')
                  }
                  try {
                    setSaving(true)
                    await facilityService.createFacilityMultipart({
                      fields: {
                        name: form.name,
                        description: form.description,
                        category: form.category || '',
                        openingHours: form.openingHours || '',
                        status: form.status || 'open'
                      },
                      images: form.images || []
                    })
                    setShowCreate(false)
                    setForm({ name: '', description: '', category: '', openingHours: '', status: 'open', images: [] })
                    fetchFacilities()
                  } catch (e) {
                    setError(e.message || 'Failed to create facility')
                  } finally {
                    setSaving(false)
                  }
                }}
                className={`px-5 py-2 rounded-xl text-white ${saving ? 'opacity-70' : ''} bg-gradient-to-r from-blue-600 to-purple-600`}
              >{saving ? 'Creating...' : 'Create Facility'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Facilities
