import express from 'express'
import {
  getPaymentGateways,
  createPayment,
  verifyPayment,
  getPaymentHistory,
  refundPayment,
  handleKhaltiReturn,
  handleEsewaReturn,
  markPaymentCompleted,
  cleanupDuplicatePayments,
  getAllPayments
} from '../controllers/paymentController.js'

const router = express.Router()

// Get available payment gateways
router.get('/gateways', getPaymentGateways)

// Get all payments (admin)
router.get('/', getAllPayments)

// Create payment
router.post('/', createPayment)

// Verify payment
router.post('/:paymentId/verify/:gateway', verifyPayment)

// Khalti redirect return (pidx & status in query)
router.get('/khalti/return', handleKhaltiReturn)

// eSewa redirect/notify return (supports GET/POST)
router.get('/esewa/return', handleEsewaReturn)
router.post('/esewa/return', handleEsewaReturn)

// Get payment history for a booking
router.get('/history/:bookingId', getPaymentHistory)

// Refund payment
router.post('/:paymentId/refund', refundPayment)

// Manually mark a payment as completed
router.post('/:paymentId/complete', markPaymentCompleted)

// Cleanup duplicate payments (admin utility). Optional body: { bookingId }
router.post('/admin/cleanup-duplicates', cleanupDuplicatePayments)

export default router
export const paymentRoutes = router
