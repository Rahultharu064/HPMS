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
    const res = await fetch(`/api/housekeepers/${id}/photo`, { method: 'POST', body: form })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to upload photo')
    return json
  },
  async deletePhoto(id) {
    return await apiRequest(`/api/housekeepers/${id}/photo`, { method: 'DELETE' })
  }
}
