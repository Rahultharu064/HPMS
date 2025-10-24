import { apiRequest } from '../utils/api'

export const hkTaskService = {
  async list(params = {}) {
    const query = new URLSearchParams(params)
    return await apiRequest(`/api/hk/tasks${query.toString() ? `?${query}` : ''}`)
  },
  async create(data) {
    return await apiRequest(`/api/hk/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  },
  async update(id, data) {
    return await apiRequest(`/api/hk/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  },
  async remove(id) {
    return await apiRequest(`/api/hk/tasks/${id}`, { method: 'DELETE' })
  },
  async addAttachment(id, file) {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`/api/hk/tasks/${id}/attachments`, { method: 'POST', body: form })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to add attachment')
    return json
  }
}
