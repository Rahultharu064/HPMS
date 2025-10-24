import { apiRequest } from '../utils/api'

export const hkSettingsService = {
  async get() {
    return await apiRequest('/api/settings')
  },
  async update(data) {
    return await apiRequest('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  }
}
