import express from 'express'
import { validateBody } from '../middleware/validate.js'
import { guestSchema } from '../validation/guestValidation.js'
import upload from '../middleware/upload.js'
import { 
  getAllGuests, 
  getGuestById, 
  createGuest, 
  updateGuest, 
  upsertGuest, 
  getGuestBookings, 
  deleteGuest, 
  getGuestStats, 
  searchGuests,
  uploadGuestPhoto
} from '../controllers/guestController.js'

const router = express.Router()

// Get all guests with pagination and search
router.get('/', getAllGuests)

// Get guest statistics
router.get('/stats', getGuestStats)

// Search guests
router.get('/search', searchGuests)

// Create new guest
router.post('/', validateBody(guestSchema), createGuest)

// Create or update guest (upsert)
router.post('/upsert', validateBody(guestSchema), upsertGuest)

// Get guest by ID
router.get('/:id', getGuestById)

// Update guest
router.put('/:id', updateGuest)

// Delete guest
router.delete('/:id', deleteGuest)

// Get guest bookings
router.get('/:id/bookings', getGuestBookings)

// Upload guest profile photo
router.post('/:id/photo', upload.single('photo'), uploadGuestPhoto)

export default router
