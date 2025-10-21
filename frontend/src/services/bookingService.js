import { apiRequest, apiDebug } from '../utils/api'

export const bookingService = {
  async createBooking({ roomId, checkIn, checkOut, adults, children = 0, firstName, lastName, email, phone, paymentMethod = 'Cash' }) {
    try {
      const methodMap = {
        khalti: 'Khalti',
        esewa: 'eSewa',
        cash: 'Cash',
        card: 'Card'
      }
      const normalizedMethod = methodMap[String(paymentMethod).toLowerCase()] || 'Cash'
      const payload = {
        roomId,
        checkIn,
        checkOut,
        adults,
        children,
        firstName,
        lastName,
        email,
        phone,
        paymentMethod: normalizedMethod
      }
      apiDebug.log('Creating booking with payload:', payload)
      return await apiRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
    } catch (error) {
      apiDebug.error('Error creating booking:', error)
      throw error
    }
  }
  ,
  async getBookingById(id) {
    try {
      return await apiRequest(`/api/bookings/${id}`)
    } catch (error) {
      apiDebug.error('Error fetching booking by id:', error)
      throw error
    }
  }
}
