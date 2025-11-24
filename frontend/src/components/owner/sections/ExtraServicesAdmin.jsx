import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Search, RefreshCw, Sparkles, Edit, Trash2, Upload } from 'lucide-react'
import extraServiceService from '../../../services/extraServiceService'
import serviceCategoryService from '../../../services/serviceCategoryService'
import { API_BASE_URL } from '../../../utils/api'
import { toast } from 'react-hot-toast'

const ExtraServicesAdmin = ({ darkMode }) => {
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ search: '', category: '' })
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [form, setForm] = useState({
    categoryId: '',
    name: '',
    description: '',
    price: '',
    image: null
  })
  const [categoryForm, setCategoryForm] = useState({
    name: ''
  })
  const [imagePreview, setImagePreview] = useState(null)

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await extraServiceService.getExtraServices()
      setServices(Array.isArray(res) ? res : [])
    } catch (e) {
      setError(e.message || 'Failed to load extra services')
      setServices([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await serviceCategoryService.getServiceCategories()
      setCategories(res || [])
    } catch (e) {
      console.error('Failed to load categories', e)
      setCategories([])
    }
  }, [])

  useEffect(() => {
    fetchServices()
    fetchCategories()
  }, [fetchServices, fetchCategories])

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      (service.category?.name && service.category.name.toLowerCase().includes(filters.search.toLowerCase())) ||
      service.description.toLowerCase().includes(filters.search.toLowerCase())

    // If no category filter is selected, show all.
    // Otherwise, check if the service has a category and if its ID matches the filter.
    const matchesCategory = !filters.category || (service.category && service.category.id.toString() === filters.category.toString())

    return matchesSearch && matchesCategory
  })

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setForm(f => ({ ...f, image: file }))
      const reader = new FileReader()
      reader.onload = () => setImagePreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleCreate = async () => {
    if (!form.categoryId || !form.name || !form.description || !form.price || !form.image) {
      return setError('All fields are required')
    }

    try {
      setSaving(true)
      const formData = new FormData()
      formData.append('categoryId', form.categoryId)
      formData.append('name', form.name)
      formData.append('description', form.description)
      formData.append('price', form.price)
      if (form.image) {
        formData.append('image', form.image)
      }

      await extraServiceService.createExtraService(formData)
      setShowCreate(false)
      setForm({ categoryId: '', name: '', description: '', price: '', image: null })
      setImagePreview(null)
      fetchServices()
      toast.success('Extra service created successfully')
    } catch (e) {
      setError(e.message || 'Failed to create extra service')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!form.categoryId || !form.name || !form.description || !form.price) {
      return setError('All fields are required')
    }
    try {
      setSaving(true)
      const formData = new FormData()
      formData.append('categoryId', form.categoryId)
      formData.append('name', form.name)
      formData.append('description', form.description)
      formData.append('price', form.price)
      if (form.image) {
        formData.append('image', form.image)
      }

      await extraServiceService.updateExtraService(editingService.id, formData)
      setShowEdit(false)
      setEditingService(null)
      setForm({ categoryId: '', name: '', description: '', price: '', image: null })
      setImagePreview(null)
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
      categoryId: service.categoryId?.toString() || '',
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      image: null
    })
    setImagePreview(service.image)
    setShowEdit(true)
  }

  const handleCreateCategory = async () => {
    if (!categoryForm.name.trim()) {
      return setError('Category name is required')
    }
    try {
      setSaving(true)
      await serviceCategoryService.createServiceCategory(categoryForm)
      setCategoryForm({ name: '' })
      fetchCategories()
      toast.success('Category created successfully')
    } catch (e) {
      setError(e.message || 'Failed to create category')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateCategory = async () => {
    if (!categoryForm.name.trim()) {
      return setError('Category name is required')
    }
    try {
      setSaving(true)
      await serviceCategoryService.updateServiceCategory(editingCategory.id, categoryForm)
      setEditingCategory(null)
      setCategoryForm({ name: '' })
      fetchCategories()
      fetchServices() // Refresh services to update category names
      toast.success('Category updated successfully')
    } catch (e) {
      setError(e.message || 'Failed to update category')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? This will affect all services in this category.')) return
    try {
      await serviceCategoryService.deleteServiceCategory(id)
      fetchCategories()
      fetchServices()
      toast.success('Category deleted successfully')
    } catch (e) {
      toast.error(e.message || 'Failed to delete category')
    }
  }

  const openEditCategoryModal = (category) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name
    })
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
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        {loading && <div className="py-10 text-center text-gray-500">Loading extra services...</div>}
        {error && !loading && <div className="py-4 text-red-500 text-sm">{error}</div>}

        {!loading && filteredServices.length === 0 && (
          <div className="py-10 text-center text-gray-500">No extra services found</div>
        )}

        {!loading && filteredServices.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Image</th>
                  <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Name</th>
                  <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Category</th>
                  <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Description</th>
                  <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Price</th>
                  <th className={`text-right py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((service) => (
                  <tr
                    key={service.id}
                    className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                  >
                    <td className="py-4 px-4">
                      {service.image ? (
                        <img
                          src={`${API_BASE_URL}${service.image}`}
                          alt={service.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
                          <Sparkles size={20} />
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{service.name}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 text-xs rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                        {service.category?.name || 'No Category'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-xs truncate`}>
                        {service.description}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className={`font-bold ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                        Rs. {service.price}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(service)}
                          className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                          title="Edit Service"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400' : 'hover:bg-gray-100 text-gray-600 hover:text-red-600'} transition-colors`}
                          title="Delete Service"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'} w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Create Extra Service</h4>
              <button onClick={() => setShowCreate(false)} className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>✕</button>
            </div>

            {error && <div className="text-red-500 text-sm mb-3">{error}</div>}

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm mb-1">Category *</label>
                <div className="flex gap-2">
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm(f => ({ ...f, categoryId: e.target.value }))}
                    className={`flex-1 px-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300'}`}
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowCategoryManager(true)}
                    className={`px-3 py-2 rounded-xl ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    title="Manage Categories"
                  >
                    +
                  </button>
                </div>
                {categories.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">No categories available. Click + to add categories.</p>
                )}
              </div>

              <div>
                <label className="block text-sm mb-1">Service Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300'}`}
                  placeholder="e.g., Momo, Coffee, Airport Transfer"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300'}`}
                  placeholder="Detailed description of the service"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Price (Rs.) *</label>
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
                <label className="block text-sm mb-1">Service Image</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="create-image"
                  />
                  <label
                    htmlFor="create-image"
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    <Upload size={16} />
                    Choose Image
                  </label>
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className={`${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-4 py-2 rounded-xl`}>Cancel</button>
              <button
                disabled={saving || !form.categoryId || !form.name || !form.description || !form.price}
                onClick={handleCreate}
                className={`px-5 py-2 rounded-xl text-white ${(saving || !form.categoryId || !form.name || !form.description || !form.price) ? 'opacity-70' : ''} bg-gradient-to-r from-blue-600 to-purple-600`}
              >{saving ? 'Creating...' : 'Create Service'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'} w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Edit Extra Service</h4>
              <button onClick={() => setShowEdit(false)} className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>✕</button>
            </div>

            {error && <div className="text-red-500 text-sm mb-3">{error}</div>}

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm mb-1">Category *</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm(f => ({ ...f, categoryId: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300'}`}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Service Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300'}`}
                  placeholder="e.g., Momo, Coffee, Airport Transfer"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300'}`}
                  placeholder="Detailed description of the service"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Price (Rs.) *</label>
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
                <label className="block text-sm mb-1">Service Image</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="edit-image"
                  />
                  <label
                    htmlFor="edit-image"
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    <Upload size={16} />
                    Choose Image
                  </label>
                  {imagePreview && (
                    <img src={imagePreview.startsWith('data:') ? imagePreview : `/uploads/${imagePreview}`} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setShowEdit(false); setForm({ categoryId: '', name: '', description: '', price: '', image: null }); setImagePreview(null); }} className={`${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-4 py-2 rounded-xl`}>Cancel</button>
              <button
                disabled={saving || !form.categoryId || !form.name || !form.description || !form.price}
                onClick={handleEdit}
                className={`px-5 py-2 rounded-xl text-white ${(saving || !form.categoryId || !form.name || !form.description || !form.price) ? 'opacity-70' : ''} bg-gradient-to-r from-blue-600 to-purple-600`}
              >{saving ? 'Updating...' : 'Update Service'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'} w-full max-w-4xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-semibold">Manage Service Categories</h4>
              <button onClick={() => setShowCategoryManager(false)} className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>✕</button>
            </div>

            {error && <div className="text-red-500 text-sm mb-3">{error}</div>}

            {/* Create/Edit Category Form */}
            <div className={`rounded-xl p-4 mb-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'bg-gray-600' : 'bg-blue-100'}`}>
                  <Plus className={darkMode ? 'text-blue-300' : 'text-blue-600'} size={16} />
                </div>
                <h5 className="text-lg font-medium">{editingCategory ? 'Edit Category' : 'Create New Category'}</h5>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Category Name *</label>
                  <input
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm(f => ({ ...f, name: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`}
                    placeholder="e.g., Food, Beverage, Transportation"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => { setEditingCategory(null); setCategoryForm({ name: '' }); }}
                  className={`px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Clear
                </button>
                <button
                  disabled={saving || !categoryForm.name.trim()}
                  onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                  className={`px-5 py-2 rounded-xl text-white ${(saving || !categoryForm.name.trim()) ? 'opacity-70' : ''} bg-gradient-to-r from-blue-600 to-purple-600`}
                >
                  {saving ? (editingCategory ? 'Updating...' : 'Creating...') : (editingCategory ? 'Update Category' : 'Create Category')}
                </button>
              </div>
            </div>

            {/* Categories List */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-4">
                <h5 className="text-lg font-medium">Existing Categories</h5>
                <span className={`px-2 py-1 text-xs rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                  {categories.length} categories
                </span>
              </div>

              {categories.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No categories created yet. Create your first category above.
                </div>
              )}

              {categories.map((category) => (
                <div key={category.id} className={`rounded-xl p-4 border ${darkMode ? 'border-gray-600 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h6 className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{category.name}</h6>
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`px-2 py-1 text-xs rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                          {category._count?.extraServices || 0} services
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditCategoryModal(category)}
                        className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      >
                        <Edit size={16} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className={`p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-red-700'}`}
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button onClick={() => setShowCategoryManager(false)} className={`px-6 py-2 rounded-xl ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExtraServicesAdmin
