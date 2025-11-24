import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Loader2, RefreshCw, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import serviceCategoryService from '../../../services/serviceCategoryService'

const ServiceCategories = ({ darkMode }) => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: ''
  })
  const [saving, setSaving] = useState(false)

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await serviceCategoryService.getServiceCategories()
      setCategories(data)
    } catch (err) {
      setError(err.message || 'Failed to fetch service categories')
      console.error('Error fetching categories:', err)
    } finally {
      setLoading(false)
    }
  }

  // Create category
  const handleCreateCategory = async () => {
    if (!formData.name.trim()) {
      toast.error('Category name is required')
      return
    }

    try {
      setSaving(true)
      await serviceCategoryService.createServiceCategory(formData)
      toast.success('Service category created successfully!')
      setShowCreateModal(false)
      setFormData({ name: '' })
      fetchCategories()
    } catch (err) {
      console.error('Error creating category:', err)
      toast.error(err.message || 'Failed to create service category')
    } finally {
      setSaving(false)
    }
  }

  // Update category
  const handleUpdateCategory = async () => {
    if (!formData.name.trim()) {
      toast.error('Category name is required')
      return
    }

    try {
      setSaving(true)
      await serviceCategoryService.updateServiceCategory(selectedCategory.id, formData)
      toast.success('Service category updated successfully!')
      setShowUpdateModal(false)
      setSelectedCategory(null)
      setFormData({ name: '' })
      fetchCategories()
    } catch (err) {
      console.error('Error updating category:', err)
      toast.error(err.message || 'Failed to update service category')
    } finally {
      setSaving(false)
    }
  }

  // Delete category
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this service category?')) return

    try {
      await serviceCategoryService.deleteServiceCategory(categoryId)
      toast.success('Service category deleted successfully!')
      fetchCategories()
    } catch (err) {
      console.error('Error deleting category:', err)
      toast.error(err.message || 'Failed to delete service category')
    }
  }

  // Open edit modal
  const handleEditCategory = (category) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name || ''
    })
    setShowUpdateModal(true)
  }

  // Close modals
  const closeModals = () => {
    setShowCreateModal(false)
    setShowUpdateModal(false)
    setSelectedCategory(null)
    setFormData({ name: '' })
  }

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  return (
    <div className="space-y-6">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Service Categories</h3>
          <div className="flex gap-3">
            <button
              onClick={() => fetchCategories()}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${darkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                } transition-colors disabled:opacity-50`}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              <Plus size={16} />
              <span>Add Category</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <span className={`ml-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading categories...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className={`text-red-500 mb-4`}>{error}</p>
            <button
              onClick={fetchCategories}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Name</th>
                  <th className={`text-right py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="text-center py-12">
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No service categories found</p>
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr
                      key={category.id}
                      className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                    >
                      <td className="py-4 px-4">
                        <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{category.name}</p>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                            title="Edit Category"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400' : 'hover:bg-gray-100 text-gray-600 hover:text-red-600'} transition-colors`}
                            title="Delete Category"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Category Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 w-full max-w-md shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Create Service Category</h3>
              <button onClick={closeModals} className={`text-gray-400 hover:text-gray-600`}>
                <AlertTriangle size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Category name"
                  className={`w-full px-3 py-2 border rounded-lg ${darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={closeModals} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? 'Creating...' : 'Create'}
                {saving && <Loader2 className="animate-spin" size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Category Modal */}
      {showUpdateModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 w-full max-w-md shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Update Service Category</h3>
              <button onClick={closeModals} className={`text-gray-400 hover:text-gray-600`}>
                <AlertTriangle size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Category name"
                  className={`w-full px-3 py-2 border rounded-lg ${darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={closeModals} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleUpdateCategory}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? 'Updating...' : 'Update'}
                {saving && <Loader2 className="animate-spin" size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceCategories
