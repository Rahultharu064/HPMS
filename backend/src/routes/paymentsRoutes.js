import express from 'express'
import { 
  getPaymentGateways, 
  createPayment, 
  verifyPayment, 
  getPaymentHistory, 
  refundPayment 
} from '../controllers/paymentController.js'

const router = express.Router()

// Get available payment gateways
router.get('/gateways', getPaymentGateways)

// Create payment
router.post('/', createPayment)

// Verify payment
router.post('/:paymentId/verify/:gateway', verifyPayment)

// Get payment history for a booking
router.get('/history/:bookingId', getPaymentHistory)

// Refund payment
router.post('/:paymentId/refund', refundPayment)

export default router
