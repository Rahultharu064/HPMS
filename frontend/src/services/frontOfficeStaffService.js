import { API_BASE_URL } from '../utils/api'

const frontOfficeStaffService = {
  list: async (params = {}) => {
    const query = new URLSearchParams(params).toString()
    const response = await fetch(`${API_BASE_URL}/api/front-office-staff?${query}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to fetch front office staff')
    return data
  },

  get: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/front-office-staff/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to fetch front office staff')
    return data
  },

  create: async (staffData) => {
    const response = await fetch(`${API_BASE_URL}/api/front-office-staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(staffData)
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to create front office staff')
    return data
  },

  update: async (id, staffData) => {
    const response = await fetch(`${API_BASE_URL}/api/front-office-staff/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(staffData)
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to update front office staff')
    return data
  },

  remove: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/front-office-staff/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to delete front office staff')
    return data
  },

  resetPassword: async (id, newPassword) => {
    const response = await fetch(`${API_BASE_URL}/api/front-office-staff/${id}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ newPassword })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to reset password')
    return data
  }
}

export { frontOfficeStaffService }
