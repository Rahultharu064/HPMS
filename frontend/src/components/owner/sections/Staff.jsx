import React, { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { frontOfficeStaffService } from '../../../services/frontOfficeStaffService'
import { housekeeperService } from '../../../services/housekeeperService'
import { Plus, Users, RefreshCw, Edit, Trash2, Mail, Lock } from 'lucide-react'

const Staff = ({ darkMode }) => {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    role: 'FRONT_OFFICE',
    shift: 'MORNING',
    contact: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [editingRole, setEditingRole] = useState(null)


  const load = async () => {
    setLoading(true)
    try {
      const [frontOfficeRes, housekeepingRes] = await Promise.all([
        frontOfficeStaffService.list(),
        housekeeperService.list()
      ])
      const frontOfficeStaff = (frontOfficeRes?.data || []).map(s => ({ ...s, role: 'FRONT_OFFICE' }))
      const housekeepingStaff = (housekeepingRes?.data || []).map(s => ({ ...s, role: 'HOUSEKEEPING' }))
      setStaff([...frontOfficeStaff, ...housekeepingStaff])
    } catch (e) {
      console.error(e)
      toast.error('Failed to load staff')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setCreateForm({ name: '', email: '', role: 'FRONT_OFFICE', shift: 'MORNING', contact: '' })
    setShowCreate(true)
  }

  const openEdit = (staffMember) => {
    setCreateForm({
      name: staffMember.name,
      email: staffMember.email || '',
      role: staffMember.role,
      shift: staffMember.shift || 'MORNING',
      contact: staffMember.contact || ''
    })
    setEditingId(staffMember.id)
    setEditingRole(staffMember.role)
    setShowCreate(true)
  }

  const submitCreate = async (e) => {
    e?.preventDefault?.()
    try {
      if (!createForm.name) {
        toast.error('Name is required')
        return
      }
      if (!createForm.email) {
        toast.error('Email is required')
        return
      }
      setCreating(true)

      const service = createForm.role === 'HOUSEKEEPING' ? housekeeperService : frontOfficeStaffService

      if (editingId) {
        await service.update(editingId, createForm)
        toast.success(`${createForm.role === 'HOUSEKEEPING' ? 'Housekeeping' : 'Front office'} staff updated`)
      } else {
        const response = await service.create(createForm)
        toast.success(response.message || `${createForm.role === 'HOUSEKEEPING' ? 'Housekeeping' : 'Front office'} staff created`)

        await load()

        // Store temporary password in the staff card
        if (response.tempPassword) {
          setStaff(prev => prev.map(s => s.email === createForm.email ? { ...s, tempPassword: response.tempPassword } : s))
        }
      }

      setShowCreate(false)
      setEditingId(null)
      setEditingRole(null)
      setCreateForm({ name: '', email: '', role: 'FRONT_OFFICE', shift: 'MORNING', contact: '' })
    } catch (e) {
      console.error(e)
      toast.error(e?.message || 'Failed to save staff')
    } finally {
      setCreating(false)
    }
  }

  const deleteStaff = async (staffId, role) => {
    const roleText = role === 'HOUSEKEEPING' ? 'housekeeping' : 'front office'
    if (!window.confirm(`Are you sure you want to delete this ${roleText} staff member? This action cannot be undone.`)) return
    try {
      const service = role === 'HOUSEKEEPING' ? housekeeperService : frontOfficeStaffService
      await service.remove(staffId)
      toast.success(`${roleText} staff deleted successfully`)
      await load()
    } catch (e) {
      console.error(e)
      toast.error(`Failed to delete ${roleText} staff`)
    }
  }



  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getShiftColor = (shift) => {
    switch (shift) {
      case 'MORNING': return 'bg-yellow-100 text-yellow-800'
      case 'AFTERNOON': return 'bg-orange-100 text-orange-800'
      case 'EVENING': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
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
            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Manage front office and housekeeping staff members</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} title="Refresh" className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700' : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'} px-3 py-2 rounded-xl flex items-center gap-2`}>
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openCreate} className={`px-4 py-2 rounded-xl flex items-center gap-2 shadow ${darkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'}`}>
            <Plus className="w-4 h-4" />
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading staff...</div>
      ) : staff.length === 0 ? (
        <div className={`text-center py-12 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <div className="text-6xl mb-4">👥</div>
          <div className="text-xl font-semibold mb-2">No staff found</div>
          <div className="text-sm">Add your first staff member to get started</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {staff.map(staffMember => (
            <div key={staffMember.id} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 hover:shadow-lg transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {getInitials(staffMember.name)}
                  </div>
                  <div>
                    <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{staffMember.name}</h4>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{staffMember.email}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(staffMember)}
                    className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteStaff(staffMember.id, staffMember.role)}
                    className={`p-2 rounded-lg ${darkMode ? 'bg-red-700 hover:bg-red-600 text-red-200' : 'bg-red-100 hover:bg-red-200 text-red-800'}`}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${staffMember.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {staffMember.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Shift:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getShiftColor(staffMember.shift)}`}>
                    {staffMember.shift}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Role:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${staffMember.role === 'HOUSEKEEPING' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {staffMember.role === 'HOUSEKEEPING' ? 'Housekeeping' : 'Front Office'}
                  </span>
                </div>
                {staffMember.tempPassword && (
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Temp Password:</span>
                    <span className={`text-sm font-mono ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                      {staffMember.tempPassword}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Joined:</span>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {new Date(staffMember.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} w-full max-w-lg rounded-2xl p-6 shadow-xl`}>
            <h3 className="text-xl font-semibold mb-4">
              {editingId ? `Edit ${editingRole === 'HOUSEKEEPING' ? 'Housekeeping' : 'Front Office'} Staff` : 'Add Staff'}
            </h3>
            <form onSubmit={submitCreate} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  required
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300'} w-full px-3 py-2 rounded-lg border`}
                  placeholder="Enter staff name"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Email <span className="text-red-500">*</span></label>
                <input
                  required
                  type="email"
                  value={createForm.email}
                  onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300'} w-full px-3 py-2 rounded-lg border`}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Role <span className="text-red-500">*</span></label>
                <select
                  required
                  value={createForm.role}
                  onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
                  className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300'} w-full px-3 py-2 rounded-lg border`}
                >
                  <option value="FRONT_OFFICE">Front Office</option>
                  <option value="HOUSEKEEPING">Housekeeping</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Shift</label>
                <select
                  value={createForm.shift}
                  onChange={e => setCreateForm(f => ({ ...f, shift: e.target.value }))}
                  className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300'} w-full px-3 py-2 rounded-lg border`}
                >
                  <option value="MORNING">Morning (06:00-12:00)</option>
                  <option value="AFTERNOON">Afternoon (12:00-18:00)</option>
                  <option value="EVENING">Evening (18:00-24:00)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Contact</label>
                <input
                  value={createForm.contact}
                  onChange={e => setCreateForm(f => ({ ...f, contact: e.target.value }))}
                  className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300'} w-full px-3 py-2 rounded-lg border`}
                  placeholder="Phone number or email"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false)
                    setEditingId(null)
                    setEditingRole(null)
                    setCreateForm({ name: '', email: '', role: 'FRONT_OFFICE', shift: 'MORNING', contact: '' })
                  }}
                  className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-4 py-2 rounded-lg`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} ${creating ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {creating ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update' : 'Create')}
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
