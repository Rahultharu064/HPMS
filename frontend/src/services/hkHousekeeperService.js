import { apiRequest } from '../utils/api'

export const hkHousekeeperService = {
  async list(params = {}) {
    const q = new URLSearchParams(params)
    return await apiRequest(`/api/housekeepers${q.toString() ? `?${q}` : ''}`)
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
    return await apiRequest(`/api/housekeepers/${id}/photo`, {
      method: 'POST',
      body: form
    })
  },
  async deletePhoto(id) {
    return await apiRequest(`/api/housekeepers/${id}/photo`, { method: 'DELETE' })
  }
}
