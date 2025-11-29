import express from 'express'
import { validateBody } from '../middleware/validate.js'
import upload from '../middleware/upload.js'
import { bookingSchema } from '../validation/bookingValidation.js'
import {
  createBooking,
  getBookingById,
  getAllBookings,
  updateBooking,
  cancelBooking,
  deleteBooking,
  getBookingStats,
  getBookingSourceAnalytics,
  uploadIdProof,
  createBookingWorkflowLog,
  sendReceiptEmail
} from '../controllers/bookingController.js'

const router = express.Router()

// Get all bookings with pagination and filters
router.get('/', getAllBookings)

// Get booking statistics
router.get('/stats', getBookingStats)

// Get booking source analytics
router.get('/analytics/source', getBookingSourceAnalytics)

// Create new booking
router.post('/', validateBody(bookingSchema), createBooking)

// Upload booking ID proof image (field name: idProof)
router.post('/:id/id-proof', upload.single('idProof'), uploadIdProof)

// Send receipt email to guest
router.post('/:id/send-receipt', sendReceiptEmail)

// Get booking by ID
router.get('/:id', getBookingById)

// Update booking
router.put('/:id', updateBooking)

// Cancel booking
router.patch('/:id/cancel', cancelBooking)

// Delete booking
router.delete('/:id', deleteBooking)

// Create booking workflow log (check-in/check-out)
router.post('/:id/workflow', createBookingWorkflowLog)

export default router
