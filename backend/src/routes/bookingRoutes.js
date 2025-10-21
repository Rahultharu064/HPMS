import express from 'express'
import { validateBody } from '../middleware/validate.js'
import { bookingSchema } from '../validation/bookingValidation.js'
import { 
  createBooking, 
  getBookingById, 
  getAllBookings, 
  updateBooking, 
  cancelBooking, 
  deleteBooking, 
  getBookingStats 
} from '../controllers/bookingController.js'

const router = express.Router()

// Get all bookings with pagination and filters
router.get('/', getAllBookings)

// Get booking statistics
router.get('/stats', getBookingStats)

// Create new booking
router.post('/', validateBody(bookingSchema), createBooking)

// Get booking by ID
router.get('/:id', getBookingById)

// Update booking
router.put('/:id', updateBooking)

// Cancel booking
router.patch('/:id/cancel', cancelBooking)

// Delete booking
router.delete('/:id', deleteBooking)

export default router
