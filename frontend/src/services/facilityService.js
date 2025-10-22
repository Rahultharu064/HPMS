import { apiRequest, apiDebug } from '../utils/api'
import { API_BASE_URL } from '../utils/api'

export const facilityService = {
  async getFacilities(filters = {}) {
    try {
      const query = new URLSearchParams({ ...filters })
      return await apiRequest(`/api/facilities${query.toString() ? `?${query}` : ''}`)
    } catch (error) {
      apiDebug.error('Error fetching facilities:', error)
      throw error
    }
  },

  async createFacilityMultipart({ fields = {}, images = [], videos = [] }) {
    try {
      const form = new FormData()
      Object.entries(fields).forEach(([k, v]) => {
        if (v !== undefined && v !== null) form.append(k, v)
      })
      images.forEach((file) => form.append('images', file))
      videos.forEach((file) => form.append('videos', file))

      const res = await fetch(`${API_BASE_URL}/api/facilities`, {
        method: 'POST',
        body: form
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to create facility')
      return data
    } catch (error) {
      apiDebug.error('Error creating facility (multipart):', error)
      throw error
    }
  },

  async getFacilityById(idOrSlug) {
    try {
      return await apiRequest(`/api/facilities/${idOrSlug}`)
    } catch (error) {
      apiDebug.error('Error fetching facility:', error)
      throw error
    }
  },

  async createFacility(payload) {
    try {
      return await apiRequest(`/api/facilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      apiDebug.error('Error creating facility:', error)
      throw error
    }
  },

  async updateFacility(idOrSlug, payload) {
    try {
      return await apiRequest(`/api/facilities/${idOrSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      apiDebug.error('Error updating facility:', error)
      throw error
    }
  },

  async deleteFacility(idOrSlug) {
    try {
      return await apiRequest(`/api/facilities/${idOrSlug}`, {
        method: 'DELETE'
      })
    } catch (error) {
      apiDebug.error('Error deleting facility:', error)
      throw error
    }
  }
}
