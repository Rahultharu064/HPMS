import React, { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { hkHousekeeperService } from '../../../services/hkHousekeeperService'
import { Plus, Edit, Trash2, Upload, X, User } from 'lucide-react'

const HousekeeperManagement = ({ darkMode }) => {
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
    try {
      setLoading(true)
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

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    try {
      setCreating(true)
      await hkHousekeeperService.create(form)
      toast.success('Housekeeper created')
      setShowCreate(false)
      setForm({ name: '', role: '', contact: '' })
      await loadHousekeepers()
    } catch (e) {
      console.error(e)
      toast.error(e?.message || 'Failed to create housekeeper')
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    try {
      setCreating(true)
      await hkHousekeeperService.update(editingId, form)
      toast.success('Housekeeper updated')
      setShowEdit(false)
      setEditingId(null)
      setForm({ name: '', role: '', contact: '' })
      await loadHousekeepers()
    } catch (e) {
      console.error(e)
      toast.error(e?.message || 'Failed to update housekeeper')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this housekeeper?')) return
    try {
      // Note: There's no delete endpoint in the service, so we'll just show an error
      toast.error('Delete functionality not implemented')
    } catch (e) {
      console.error(e)
      toast.error('Failed to delete housekeeper')
    }
  }

  const handlePhotoUpload = async (id, file) => {
    if (!file) return
    try {
      setUploading(id)
      await hkHousekeeperService.uploadPhoto(id, file)
      toast.success('Photo uploaded successfully')
      await loadHousekeepers()
    } catch (e) {
      console.error(e)
      toast.error(e?.message || 'Failed to upload photo')
    } finally {
      setUploading(null)
    }
  }

  const handlePhotoDelete = async (id) => {
    try {
      await hkHousekeeperService.deletePhoto(id)
      toast.success('Photo deleted')
      await loadHousekeepers()
    } catch (e) {
      console.error(e)
      toast.error(e?.message || 'Failed to delete photo')
    }
  }

  const openEdit = (housekeeper) => {
    setForm({
      name: housekeeper.name || '',
      role: housekeeper.role || '',
      contact: housekeeper.contact || ''
    })
    setEditingId(housekeeper.id)
    setShowEdit(true)
  }

  const openCreate = () => {
    setForm({ name: '', role: '', contact: '' })
    setShowCreate(true)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className={`${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white'} border rounded-2xl p-4 flex items-center justify-between shadow-sm`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-gray-900 text-white' : 'bg-blue-50 text-blue-600'}`}>
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Housekeeper Management</h2>
            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Manage housekeeping staff profiles</div>
          </div>
        </div>
        <button 
          onClick={openCreate}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 shadow ${darkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'}`}
        >
          <Plus className="w-4 h-4" />
          <span>Add Housekeeper</span>
        </button>
      </div>

      {loading ? (
        <div className={`${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white'} border rounded-2xl p-8 text-center`}>
          <div className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Loading housekeepers...</div>
        </div>
      ) : housekeepers.length === 0 ? (
        <div className={`${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white'} border rounded-2xl p-8 text-center`}>
          <div className={darkMode ? 'text-gray-300' : 'text-gray-600'}>No housekeepers found. Add your first housekeeper to get started.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {housekeepers.map(housekeeper => (
            <div key={housekeeper.id} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6`}>
              <div className="flex items-center justify-between mb-4">
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
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${housekeeper.profilePictureUrl ? 'hidden' : 'flex'}`}
                      style={{ backgroundColor: `hsl(${housekeeper.id * 137.5 % 360}, 70%, 50%)` }}
                    >
                      {housekeeper.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    {uploading === housekeeper.id && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {housekeeper.name}
                    </h3>
                    {housekeeper.role && (
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {housekeeper.role}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(housekeeper)}
                    className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(housekeeper.id)}
                    className={`p-2 rounded-lg ${darkMode ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-red-100 hover:bg-red-200 text-red-800'}`}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {housekeeper.contact && (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                  📞 {housekeeper.contact}
                </p>
              )}

              <div className="flex gap-2">
                <label className={`flex-1 px-3 py-2 rounded-lg text-center cursor-pointer ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                  <Upload className="w-4 h-4 inline mr-1" />
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) handlePhotoUpload(housekeeper.id, file)
                    }}
                    disabled={uploading === housekeeper.id}
                  />
                </label>
                {housekeeper.profilePictureUrl && (
                  <button
                    onClick={() => handlePhotoDelete(housekeeper.id)}
                    className={`px-3 py-2 rounded-lg ${darkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
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
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} w-full max-w-md rounded-2xl p-6 shadow-xl`}>
            <h3 className="text-xl font-semibold mb-4">Add Housekeeper</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white'} w-full px-3 py-2 rounded-lg border`}
                  placeholder="Enter housekeeper name"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Role</label>
                <input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white'} w-full px-3 py-2 rounded-lg border`}
                  placeholder="e.g. Senior Housekeeper, Supervisor"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Contact</label>
                <input
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white'} w-full px-3 py-2 rounded-lg border`}
                  placeholder="Phone number or email"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
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
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} w-full max-w-md rounded-2xl p-6 shadow-xl`}>
            <h3 className="text-xl font-semibold mb-4">Edit Housekeeper</h3>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white'} w-full px-3 py-2 rounded-lg border`}
                  placeholder="Enter housekeeper name"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Role</label>
                <input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white'} w-full px-3 py-2 rounded-lg border`}
                  placeholder="e.g. Senior Housekeeper, Supervisor"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Contact</label>
                <input
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white'} w-full px-3 py-2 rounded-lg border`}
                  placeholder="Phone number or email"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
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

export default HousekeeperManagement