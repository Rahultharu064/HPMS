import React, { useMemo, useState, useEffect } from 'react'
import { Plus, Eye, Edit, Trash2, Loader2, RefreshCw, Search, UserIcon, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { guestService } from '../../../services/guestService'

const getStatusColor = (isVerified) => {
  return isVerified ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
}

const Users = ({ darkMode }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })
  const [saving, setSaving] = useState(false)

  // Fetch users from backend
  const fetchUsers = async (page = 1, limit = 10, search = '') => {
    try {
      setLoading(true)
      setError(null)

      const data = await guestService.getGuests({ page, limit, search })

      setUsers(data.data)
      setPagination({
        currentPage: data.currentPage || page,
        totalPages: data.totalPages || 1,
        total: data.total || 0
      })
    } catch (err) {
      setError(err.message || 'Network error: Unable to fetch users')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return

    try {
      console.log('Attempting to delete user with ID:', userId)
      const result = await guestService.deleteGuest(userId)
      console.log('Delete result:', result)

      // Show success message
      toast.success('User deleted successfully!')

      // Refresh the users list
      fetchUsers(pagination.currentPage, 10, searchQuery)
    } catch (err) {
      console.error('Error deleting user:', err)
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        userId: userId
      })

      // More detailed error message
      const errorMessage = err.message || 'Network error: Unable to delete user'
      toast.error(`Failed to delete user: ${errorMessage}`)
    }
  }

  // Calculate user statistics from fetched data
  const topStats = useMemo(() => {
    const total = users.length
    const verified = users.filter(user => user.isVerified).length
    const unverified = total - verified

    return [
      { label: 'Total Users', value: total.toString(), color: 'gray', icon: UserIcon },
      { label: 'Verified', value: verified.toString(), color: 'emerald', icon: CheckCircle },
      { label: 'Unverified', value: unverified.toString(), color: 'yellow', icon: Clock }
    ]
  }, [users])

  // Handle view user
  const handleViewUser = (user) => {
    setSelectedUser(user)
    setShowViewModal(true)
  }

  // Handle edit user
  const handleEditUser = (user) => {
    setSelectedUser(user)
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || ''
    })
    setShowUpdateModal(true)
  }

  // Handle successful update
  const handleUpdateSuccess = () => {
    fetchUsers(pagination.currentPage, 10, searchQuery)
    setShowUpdateModal(false)
    setSelectedUser(null)
  }

  // Handle edit form submission
  const handleEditSubmit = async () => {
    if (!selectedUser) return
    try {
      setSaving(true)
      await guestService.updateGuest(selectedUser.id, editForm)
      toast.success('User updated successfully!')
      handleUpdateSuccess()
    } catch (err) {
      console.error('Error updating user:', err)
      toast.error(`Failed to update user: ${err.message || 'Network error'}`)
    } finally {
      setSaving(false)
    }
  }

  // Close modals
  const closeModals = () => {
    setShowViewModal(false)
    setShowUpdateModal(false)
    setSelectedUser(null)
    setEditForm({ firstName: '', lastName: '', email: '', phone: '' })
  }

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault()
    fetchUsers(1, 10, searchQuery)
  }

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {topStats.map((stat, idx) => (
          <div key={idx} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center gap-3 mb-2">
              <stat.icon className={`text-${stat.color}-600`} size={24} />
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
            </div>
            <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>User Management</h3>
          <div className="flex gap-3">
            <button
              onClick={() => fetchUsers(pagination.currentPage, 10, searchQuery)}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${
                darkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              } transition-colors disabled:opacity-50`}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or phone..."
                className={`w-full pl-10 pr-4 py-2 rounded-xl border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <span className={`ml-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading users...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className={`text-red-500 mb-4`}>{error}</p>
            <button
              onClick={() => fetchUsers()}
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
                  <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Email</th>
                  <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Phone</th>
                  <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Status</th>
                  <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Joined</th>
                  <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12">
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No users found</p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className={`border-b cursor-pointer ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                    >
                      <td className="py-4 px-4">
                        <div>
                          <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.firstName} {user.lastName}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{user.email}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{user.phone}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(user.isVerified)}`}>
                          {user.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleViewUser(user) }}
                            className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditUser(user) }}
                            className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                            title="Edit User"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteUser(user.id) }}
                            className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400' : 'hover:bg-gray-100 text-gray-600 hover:text-red-600'} transition-colors`}
                            title="Delete User"
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Showing {users.length} of {pagination.total} users
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchUsers(pagination.currentPage - 1, 10, searchQuery)}
                    disabled={pagination.currentPage === 1}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      pagination.currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    Previous
                  </button>
                  <span className={`px-3 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => fetchUsers(pagination.currentPage + 1, 10, searchQuery)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      pagination.currentPage === pagination.totalPages
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 w-full max-w-md shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>User Details</h3>
              <button onClick={closeModals} className={`text-gray-400 hover:text-gray-600`}>
                <AlertTriangle size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Name</label>
                <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser.firstName} {selectedUser.lastName}</p>
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Email</label>
                <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser.email}</p>
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Phone</label>
                <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser.phone}</p>
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Status</label>
                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(selectedUser.isVerified)}`}>
                  {selectedUser.isVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Joined</label>
                <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={closeModals} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update User Modal */}
      {showUpdateModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 w-full max-w-md shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Edit User</h3>
              <button onClick={closeModals} className={`text-gray-400 hover:text-gray-600`}>
                <AlertTriangle size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>First Name</label>
                <input
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Last Name</label>
                <input
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    darkMode
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
                onClick={handleEditSubmit}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? 'Saving...' : 'Save'}
                {saving && <Loader2 className="animate-spin" size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users
