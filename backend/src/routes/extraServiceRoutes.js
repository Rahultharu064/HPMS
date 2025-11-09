import express from 'express';
const router = express.Router();
import extraServiceController from '../controllers/extraServiceController.js';

// Extra services CRUD routes
router.get('/', extraServiceController.getExtraServices);
router.post('/', extraServiceController.createExtraService);
router.put('/:id', extraServiceController.updateExtraService);
router.delete('/:id', extraServiceController.deleteExtraService);

// Booking extra services routes
router.post('/booking', extraServiceController.addExtraServiceToBooking);
router.delete('/booking/:id', extraServiceController.removeExtraServiceFromBooking);
router.get('/booking/:bookingId', extraServiceController.getBookingExtraServices);

export default router;
