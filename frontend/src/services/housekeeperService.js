import { apiRequest, API_BASE_URL } from '../utils/api'

export const housekeeperService = {
  async list(params = {}) {
    const query = new URLSearchParams(params)
    return await apiRequest(`/api/housekeepers${query.toString() ? `?${query}` : ''}`)
  },

  async get(id) {
    return await apiRequest(`/api/housekeepers/${id}`)
  },

  async create(data) {
    return await apiRequest(`/api/housekeepers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  },

  async update(id, data) {
    return await apiRequest(`/api/housekeepers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  },

  async uploadPhoto(id, file) {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${API_BASE_URL}/api/housekeepers/${id}/photo`, {
      method: 'POST',
      body: form
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to upload photo')
    return json
  },

  async deletePhoto(id) {
    return await apiRequest(`/api/housekeepers/${id}/photo`, { method: 'DELETE' })
  },

  async remove(id) {
    return await apiRequest(`/api/housekeepers/${id}`, { method: 'DELETE' })
  },

  async resetPassword(id, newPassword) {
    return await apiRequest(`/api/housekeepers/${id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword })
    })
  }
}
