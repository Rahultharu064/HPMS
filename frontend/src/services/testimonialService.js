import api from '../utils/api'

const testimonialService = {
  // Get all testimonials
  getAll: async () => {
    const response = await api.get('/testimonials')
    return response.data
  },

  // Get testimonials from room reviews
  getFromReviews: async () => {
    const response = await api.get('/testimonials/from-reviews')
    return response.data
  },

  // Get all testimonials (admin)
  getAllAdmin: async () => {
    const response = await api.get('/testimonials/admin')
    return response.data
  },

  // Create testimonial (admin)
  create: async (testimonialData) => {
    const response = await api.post('/testimonials', testimonialData)
    return response.data
  },

  // Update testimonial (admin)
  update: async (id, testimonialData) => {
    const response = await api.put(`/testimonials/${id}`, testimonialData)
    return response.data
  },

  // Delete testimonial (admin)
  delete: async (id) => {
    const response = await api.delete(`/testimonials/${id}`)
    return response.data
  }
}

export default testimonialService
