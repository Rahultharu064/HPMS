import { apiRequest, apiDebug } from '../utils/api'

export const guestService = {
  async getGuests({ page = 1, limit = 10, search = '' } = {}) {
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (search) params.set('search', search)
      return await apiRequest(`/api/guests?${params.toString()}`)
    } catch (error) {
      apiDebug.error('Error fetching guests:', error)
      throw error
    }
  },
  async getGuest(id) {
    try {
      return await apiRequest(`/api/guests/${id}`)
    } catch (error) {
      apiDebug.error('Error fetching guest:', error)
      throw error
    }
  },
  async upsertGuest({ firstName, lastName, email, phone }) {
    try {
      const payload = { firstName, lastName, email, phone }
      apiDebug.log('Upserting guest:', payload)
      return await apiRequest('/api/guests/upsert', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
    } catch (error) {
      apiDebug.error('Error upserting guest:', error)
      throw error
    }
  },
  async updateGuest(id, payload) {
    try {
      apiDebug.log('Updating guest:', { id, payload })
      return await apiRequest(`/api/guests/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
    } catch (error) {
      apiDebug.error('Error updating guest:', error)
      throw error
    }
  },
  async getGuestBookings(id) {
    try {
      return await apiRequest(`/api/guests/${id}/bookings`)
    } catch (error) {
      apiDebug.error('Error fetching guest bookings:', error)
      throw error
    }
  },
  async uploadPhoto(id, file) {
    try {
      const form = new FormData()
      form.append('photo', file)
      return await apiRequest(`/api/guests/${id}/photo`, {
        method: 'POST',
        body: form
      })
    } catch (error) {
      apiDebug.error('Error uploading guest photo:', error)
      throw error
    }
  },
  async deleteGuest(id) {
    try {
      return await apiRequest(`/api/guests/${id}`, {
        method: 'DELETE'
      })
    } catch (error) {
      apiDebug.error('Error deleting guest:', error)
      throw error
    }
  }
}
