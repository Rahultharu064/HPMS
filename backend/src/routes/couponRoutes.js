import express from 'express';
import {
  getAllCoupons,
  getCouponById,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponAnalytics
} from '../controllers/couponController.js';

const router = express.Router();

// GET /api/coupons/analytics - Get coupon analytics
router.get('/analytics', getCouponAnalytics);

// GET /api/coupons - Get all active coupons
router.get('/', getAllCoupons);

// GET /api/coupons/:id - Get coupon by ID
router.get('/:id', getCouponById);

// POST /api/coupons/validate - Validate coupon code
router.post('/validate', validateCoupon);

// POST /api/coupons - Create new coupon
router.post('/', createCoupon);

// PUT /api/coupons/:id - Update coupon
router.put('/:id', updateCoupon);

// DELETE /api/coupons/:id - Delete coupon (soft delete)
router.delete('/:id', deleteCoupon);

export default router;
