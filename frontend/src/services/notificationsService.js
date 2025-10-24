import { apiRequest } from '../utils/api'

export const notificationsService = {
  async list(params = {}) {
    const q = new URLSearchParams(params)
    return await apiRequest(`/api/notifications${q.toString() ? `?${q}` : ''}`)
  },
  async markRead(id) {
    return await apiRequest(`/api/notifications/${id}/read`, { method: 'PUT' })
  }
}
