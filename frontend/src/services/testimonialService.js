import api from '../utils/api'

const testimonialService = {
  // Get all testimonials
  getAll: async () => {
    const response = await api.get('/api/testimonials')
    return response.data
  },

  // Get testimonials from room reviews
  getFromReviews: async () => {
    const response = await api.get('/api/testimonials/from-reviews')
    return response.data
  },

  // Get all testimonials (admin)
  getAllAdmin: async () => {
    const response = await api.get('/api/testimonials/admin')
    return response.data
  },

  // Create testimonial (admin)
  create: async (testimonialData) => {
    const response = await api.post('/api/testimonials', testimonialData)
    return response.data
  },

  // Update testimonial (admin)
  update: async (id, testimonialData) => {
    const response = await api.put(`/api/testimonials/${id}`, testimonialData)
    return response.data
  },

  // Delete testimonial (admin)
  delete: async (id) => {
    const response = await api.delete(`/api/testimonials/${id}`)
    return response.data
  }
}

export default testimonialService
