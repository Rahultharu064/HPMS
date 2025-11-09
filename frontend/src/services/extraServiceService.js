import api from '../utils/api';

const extraServiceService = {
  // Get all extra services
  getExtraServices: () => {
    return api.get('/api/extra-services');
  },

  // Create a new extra service (admin only)
  createExtraService: (serviceData) => {
    return api.post('/api/extra-services', serviceData);
  },

  // Update an extra service (admin only)
  updateExtraService: (id, serviceData) => {
    return api.put(`/api/extra-services/${id}`, serviceData);
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
