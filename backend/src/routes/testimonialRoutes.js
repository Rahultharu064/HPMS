import express from 'express'
const router = express.Router()
import {
  getAllTestimonials,
  getAllTestimonialsAdmin,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getTestimonialsFromReviews
} from '../controllers/testimonialController.js'
import authAdmin from '../middleware/authAdmin.js'

// Public routes
router.get('/', getAllTestimonials)
router.get('/from-reviews', getTestimonialsFromReviews)

// Admin routes
router.get('/admin', authAdmin, getAllTestimonialsAdmin)
router.post('/', authAdmin, createTestimonial)
router.put('/:id', authAdmin, updateTestimonial)
router.delete('/:id', authAdmin, deleteTestimonial)

export default router
