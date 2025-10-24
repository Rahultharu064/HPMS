import React, { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Plus, Users, RefreshCw, Edit, Trash2, Camera, X, User } from 'lucide-react'
import { hkHousekeeperService } from '../../../services/hkHousekeeperService'

const Staff = ({ darkMode }) => {
  const [housekeepers, setHousekeepers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [uploading, setUploading] = useState(null)
  const [form, setForm] = useState({
    name: '',
    role: '',
    contact: ''
  })

  const loadHousekeepers = async () => {
    setLoading(true)
    try {
      const res = await hkHousekeeperService.list()
      setHousekeepers(res.data || [])
    } catch (e) {
      console.error(e)
      toast.error('Failed to load housekeepers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHousekeepers()
  }, [])

  const openCreate = () => {
    setForm({ name: '', role: '', contact: '' })
    setShowCreate(true)
    setShowEdit(false)
  }

  const openEdit = (housekeeper) => {
    setForm({
      name: housekeeper.name || '',
      role: housekeeper.role || '',
      contact: housekeeper.contact || ''
    })
    setEditingId(housekeeper.id)
    setShowEdit(true)
    setShowCreate(false)
  }

  const closeModals = () => {
    setShowCreate(false)
    setShowEdit(false)
    setEditingId(null)
    setForm({ name: '', role: '', contact: '' })
  }

  const submitCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }

    setCreating(true)
    try {
      await hkHousekeeperService.create(form)
      toast.success('Housekeeper created successfully')
      closeModals()
      await loadHousekeepers()
    } catch (e) {
      console.error(e)
      toast.error(e.message || 'Failed to create housekeeper')
    } finally {
      setCreating(false)
    }
  }

  const submitEdit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }

    setCreating(true)
    try {
      await hkHousekeeperService.update(editingId, form)
      toast.success('Housekeeper updated successfully')
      closeModals()
      await loadHousekeepers()
    } catch (e) {
      console.error(e)
      toast.error(e.message || 'Failed to update housekeeper')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return

    try {
      await hkHousekeeperService.delete(id)
      toast.success('Housekeeper deleted successfully')
      await loadHousekeepers()
    } catch (e) {
      console.error(e)
      toast.error(e.message || 'Failed to delete housekeeper')
    }
  }

  const handlePhotoUpload = async (id, file) => {
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, WebP, JPG, GIF)')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setUploading(id)
    try {
      await hkHousekeeperService.uploadPhoto(id, file)
      toast.success('Photo uploaded successfully')
      await loadHousekeepers()
    } catch (e) {
      console.error(e)
      toast.error(e.message || 'Failed to upload photo')
    } finally {
      setUploading(null)
    }
  }

  const handleDeletePhoto = async (id) => {
    try {
      await hkHousekeeperService.deletePhoto(id)
      toast.success('Photo deleted successfully')
      await loadHousekeepers()
    } catch (e) {
      console.error(e)
      toast.error(e.message || 'Failed to delete photo')
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className={`${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white'} border rounded-2xl p-4 flex items-center justify-between shadow-sm`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-gray-900 text-white' : 'bg-blue-50 text-blue-600'}`}>
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Staff Management</h2>
            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Manage housekeeping staff profiles and photos</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadHousekeepers} 
            title="Refresh" 
            className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700' : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'} px-3 py-2 rounded-xl flex items-center gap-2`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={openCreate} 
            className={`px-4 py-2 rounded-xl flex items-center gap-2 shadow ${darkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'}`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : housekeepers.length === 0 ? (
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-8 text-center`}>
          <Users className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
          <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>No staff members</h3>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>Get started by adding your first housekeeping staff member.</p>
          <button 
            onClick={openCreate}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 mx-auto ${darkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'}`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {housekeepers.map(housekeeper => (
            <div key={housekeeper.id} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {housekeeper.profilePictureUrl ? (
                      <img 
                        src={`/uploads/${housekeeper.profilePictureUrl}`} 
                        alt={housekeeper.name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${housekeeper.profilePictureUrl ? 'hidden' : 'flex'} ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'}`}
                    >
                      <User className="w-6 h-6" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) handlePhotoUpload(housekeeper.id, file)
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploading === housekeeper.id}
                    />
                    {uploading === housekeeper.id && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {housekeeper.name}
                    </h4>
                    {housekeeper.role && (
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {housekeeper.role}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(housekeeper)}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-500'}`}
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(housekeeper.id, housekeeper.name)}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-500'}`}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {housekeeper.contact && (
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                  📞 {housekeeper.contact}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = (e) => {
                      const file = e.target.files[0]
                      if (file) handlePhotoUpload(housekeeper.id, file)
                    }
                    input.click()
                  }}
                  disabled={uploading === housekeeper.id}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} ${uploading === housekeeper.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Camera className="w-4 h-4" />
                  {uploading === housekeeper.id ? 'Uploading...' : housekeeper.profilePictureUrl ? 'Change Photo' : 'Add Photo'}
                </button>
                {housekeeper.profilePictureUrl && (
                  <button
                    onClick={() => handleDeletePhoto(housekeeper.id)}
                    className={`px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-100 hover:bg-red-200 text-red-700'}`}
                    title="Delete Photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} w-full max-w-lg rounded-2xl p-6 shadow-xl`}>
            <h3 className="text-xl font-semibold mb-4">Add New Staff Member</h3>
            <form onSubmit={submitCreate} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300'} w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Enter staff member name"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Role</label>
                <input
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300'} w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="e.g. Senior Housekeeper, Supervisor"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Contact</label>
                <input
                  value={form.contact}
                  onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                  className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300'} w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Phone number or email"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModals}
                  className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-4 py-2 rounded-lg`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} ${creating ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} w-full max-w-lg rounded-2xl p-6 shadow-xl`}>
            <h3 className="text-xl font-semibold mb-4">Edit Staff Member</h3>
            <form onSubmit={submitEdit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300'} w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Enter staff member name"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Role</label>
                <input
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300'} w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="e.g. Senior Housekeeper, Supervisor"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Contact</label>
                <input
                  value={form.contact}
                  onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                  className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300'} w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Phone number or email"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModals}
                  className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-4 py-2 rounded-lg`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} ${creating ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {creating ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Staff