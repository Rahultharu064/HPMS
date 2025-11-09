import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Search, RefreshCw, Sparkles, Edit, Trash2 } from 'lucide-react'
import extraServiceService from '../../../services/extraServiceService'
import { toast } from 'react-hot-toast'

const ExtraServicesAdmin = ({ darkMode }) => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ search: '', category: '' })
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: ''
  })

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await extraServiceService.getExtraServices()
      setServices(res.data || [])
    } catch (e) {
      setError(e.message || 'Failed to load extra services')
      setServices([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         service.description.toLowerCase().includes(filters.search.toLowerCase())
    const matchesCategory = !filters.category || service.category === filters.category
    return matchesSearch && matchesCategory
  })

  const handleCreate = async () => {
    if (!form.name || !form.description || !form.price) {
      return setError('Name, description, and price are required')
    }
    try {
      setSaving(true)
      await extraServiceService.createExtraService({
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        category: form.category
      })
      setShowCreate(false)
      setForm({ name: '', description: '', price: '', category: '' })
      fetchServices()
      toast.success('Extra service created successfully')
    } catch (e) {
      setError(e.message || 'Failed to create extra service')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!form.name || !form.description || !form.price) {
      return setError('Name, description, and price are required')
    }
    try {
      setSaving(true)
      await extraServiceService.updateExtraService(editingService.id, {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        category: form.category
      })
      setShowEdit(false)
      setEditingService(null)
      setForm({ name: '', description: '', price: '', category: '' })
      fetchServices()
      toast.success('Extra service updated successfully')
    } catch (e) {
      setError(e.message || 'Failed to update extra service')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this extra service?')) return
    try {
      await extraServiceService.deleteExtraService(id)
      fetchServices()
      toast.success('Extra service deleted successfully')
    } catch (e) {
      toast.error(e.message || 'Failed to delete extra service')
    }
  }

  const openEditModal = (service) => {
    setEditingService(service)
    setForm({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      category: service.category
    })
    setShowEdit(true)
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-blue-100'}`}>
            <Sparkles className={darkMode ? 'text-blue-300' : 'text-blue-600'} size={20} />
          </div>
          <div>
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Extra Services</h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage additional services offered to guests</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchServices} className={`flex items-center gap-2 px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg">
            <Plus size={16} /> New Service
          </button>
        </div>
      </div>

      <div className={`rounded-2xl p-4 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow'}`}>
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className={`w-full pl-9 pr-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200'}`}
              placeholder="Search services..."
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            />
          </div>
          <select
            className={`px-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200'}`}
            value={filters.category}
            onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
          >
            <option value="">All Categories</option>
            <option value="Food">Food</option>
            <option value="Beverage">Beverage</option>
            <option value="Transportation">Transportation</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {loading && <div className="py-10 text-center text-gray-500">Loading extra services...</div>}
        {error && !loading && <div className="py-4 text-red-500 text-sm">{error}</div>}

        {!loading && filteredServices.length === 0 && (
          <div className="py-10 text-center text-gray-500">No extra services found</div>
        )}

        {!loading && filteredServices.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredServices.map((service) => (
              <div key={service.id} className={`rounded-xl overflow-hidden border ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{service.name}</h4>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm line-clamp-2`}>{service.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-lg font-bold ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>Rs. {service.price}</span>
                        <span className={`px-2 py-1 bg-gray-200 text-xs rounded ${darkMode ? 'bg-gray-700 text-gray-300' : ''}`}>{service.category}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button onClick={() => openEditModal(service)} className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                        <Edit size={16} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
                      </button>
                      <button onClick={() => handleDelete(service.id)} className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-red-700'}`}>
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'} w-full max-w-md rounded-2xl p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Create Extra Service</h4>
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
                  placeholder="Service name"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300'}`}
                  placeholder="Service description"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300'}`}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300'}`}
                  >
                    <option value="">Select</option>
                    <option value="Food">Food</option>
                    <option value="Beverage">Beverage</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className={`${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-4 py-2 rounded-xl`}>Cancel</button>
              <button
                disabled={saving}
                onClick={handleCreate}
                className={`px-5 py-2 rounded-xl text-white ${saving ? 'opacity-70' : ''} bg-gradient-to-r from-blue-600 to-purple-600`}
              >{saving ? 'Creating...' : 'Create Service'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'} w-full max-w-md rounded-2xl p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Edit Extra Service</h4>
              <button onClick={() => setShowEdit(false)} className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>✕</button>
            </div>

            {error && <div className="text-red-500 text-sm mb-3">{error}</div>}

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300'}`}
                  placeholder="Service name"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300'}`}
                  placeholder="Service description"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300'}`}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300'}`}
                  >
                    <option value="">Select</option>
                    <option value="Food">Food</option>
                    <option value="Beverage">Beverage</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowEdit(false)} className={`${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-4 py-2 rounded-xl`}>Cancel</button>
              <button
                disabled={saving}
                onClick={handleEdit}
                className={`px-5 py-2 rounded-xl text-white ${saving ? 'opacity-70' : ''} bg-gradient-to-r from-blue-600 to-purple-600`}
              >{saving ? 'Updating...' : 'Update Service'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExtraServicesAdmin
