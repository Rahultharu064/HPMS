import { apiRequest } from '../utils/api'

export const bookingService = {
  async getStats(params = {}) {
    const query = new URLSearchParams(params).toString()
    const url = query ? `/api/bookings/stats?${query}` : '/api/bookings/stats'
    return await apiRequest(url)
  },

  async getSourceAnalytics() {
    return await apiRequest('/api/bookings/analytics/source')
  },

  async createBooking(bookingData) {
    return await apiRequest('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    })
  },

  async getBookingById(id) {
    return await apiRequest(`/api/bookings/${id}`)
  },

  async getAllBookings(params = {}) {
    const query = new URLSearchParams(params).toString()
    const url = query ? `/api/bookings?${query}` : '/api/bookings'
    return await apiRequest(url)
  },

  async updateBooking(id, data) {
    return await apiRequest(`/api/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  },

  async cancelBooking(id, reason = '') {
    return await apiRequest(`/api/bookings/${id}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    })
  },

  async deleteBooking(id) {
    return await apiRequest(`/api/bookings/${id}`, { method: 'DELETE' })
  },

  async addWorkflowLog(id, data) {
    return await apiRequest(`/api/bookings/${id}/workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  },

  async uploadIdProof(bookingId, file) {
    const form = new FormData()
    form.append('idProof', file)
    return await apiRequest(`/api/bookings/${bookingId}/id-proof`, {
      method: 'POST',
      body: form
    })
  },

  async sendReceiptEmail(id) {
    return await apiRequest(`/api/bookings/${id}/send-receipt`, {
      method: 'POST'
    })
  }
}

