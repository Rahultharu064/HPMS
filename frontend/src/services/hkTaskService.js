import { API_BASE_URL, apiRequest } from '../utils/api'

export const hkTaskService = {
  async list(params = {}) {
    const query = new URLSearchParams(params)
    return await apiRequest(`/api/hk/tasks${query.toString() ? `?${query}` : ''}`)
  },

  async get(id) {
    return await apiRequest(`/api/hk/tasks/${id}`)
  },

  async create(data) {
    return await apiRequest(`/api/hk/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  },

  async update(id, data) {
    const payload = { ...data }
    if (payload && typeof payload.checklist === 'object' && payload.checklist !== null) {
      payload.checklist = JSON.stringify(payload.checklist)
    }
    return await apiRequest(`/api/hk/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  },

  async remove(id) {
    return await apiRequest(`/api/hk/tasks/${id}`, { method: 'DELETE' })
  },

  async addAttachments(id, files = []) {
    const form = new FormData()
    files.forEach(f => form.append('files', f))
    const res = await fetch(`${API_BASE_URL}/api/hk/tasks/${id}/attachments`, {
      method: 'POST',
      body: form
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Failed to upload attachments')
    return data
  }
}
