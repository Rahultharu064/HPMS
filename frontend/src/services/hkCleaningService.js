import { API_BASE_URL, apiRequest } from '../utils/api'

export const hkCleaningService = {
  async getSchedule(params = {}) {
    const query = new URLSearchParams(params)
    return await apiRequest(`/api/hk/schedule${query.toString() ? `?${query}` : ''}`)
  },

  async startCleaning(data) {
    return await apiRequest(`/api/hk/cleaning/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  },

  async finishCleaning(data) {
    return await apiRequest(`/api/hk/cleaning/finish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  },

  async list(params = {}) {
    const query = new URLSearchParams(params)
    return await apiRequest(`/api/hk/cleaning${query.toString() ? `?${query}` : ''}`)
  }
}
