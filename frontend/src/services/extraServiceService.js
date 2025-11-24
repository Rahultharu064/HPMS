import api, { apiRequest } from '../utils/api';

const extraServiceService = {
  // Get all extra services
  getExtraServices: () => {
    return api.get('/api/extra-services');
  },

  // Create a new extra service (admin only)
  createExtraService: (serviceData) => {
    console.log('Frontend: Sending FormData');
    for (const [key, value] of serviceData.entries()) {
      console.log(`Frontend: ${key}: ${value}`);
    }

    // Use apiRequest directly for FormData to avoid JSON.stringify
    return apiRequest('/api/extra-services', {
      method: 'POST',
      body: serviceData,
      headers: {
        // Content-Type will be set automatically for FormData by fetch
      }
    });
  },

  // Update an extra service (admin only)
  updateExtraService: (id, serviceData) => {
    // Use apiRequest directly for FormData to avoid JSON.stringify
    return apiRequest(`/api/extra-services/${id}`, {
      method: 'PUT',
      body: serviceData,
      headers: {
        // Content-Type will be set automatically for FormData by fetch
      }
    });
  },

  // Delete an extra service (admin only)
  deleteExtraService: (id) => {
    return api.delete(`/api/extra-services/${id}`);
  },

  // Add extra service to booking
  addServiceToBooking: (bookingId, extraServiceId, quantity = 1) => {
    return api.post('/api/extra-services/booking', {
      bookingId,
      extraServiceId,
      quantity
    });
  },

  // Remove extra service from booking
  removeServiceFromBooking: (bookingServiceId) => {
    return api.delete(`/api/extra-services/booking/${bookingServiceId}`);
  },

  // Get extra services for a specific booking
  getBookingExtraServices: (bookingId) => {
    return api.get(`/api/extra-services/booking/${bookingId}`);
  }
};

export default extraServiceService;
