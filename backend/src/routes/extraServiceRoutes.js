import express from 'express';
const router = express.Router();
import extraServiceController from '../controllers/extraServiceController.js';
import upload from '../middleware/upload.js';

// Extra services CRUD routes
router.get('/', extraServiceController.getExtraServices);
router.post('/', upload.single('image'), extraServiceController.createExtraService);
router.put('/:id', upload.single('image'), extraServiceController.updateExtraService);
router.delete('/:id', extraServiceController.deleteExtraService);

// Booking extra services routes
router.post('/booking', extraServiceController.addExtraServiceToBooking);
router.delete('/booking/:id', extraServiceController.removeExtraServiceFromBooking);
router.get('/booking/:bookingId', extraServiceController.getBookingExtraServices);

export default router;
