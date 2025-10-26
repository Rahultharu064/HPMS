import express from 'express';
import {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion
} from '../controllers/promotionController.js';

const router = express.Router();

// GET /api/promotions - Get all active promotions
router.get('/', getAllPromotions);

// GET /api/promotions/:id - Get promotion by ID
router.get('/:id', getPromotionById);

// POST /api/promotions - Create new promotion
router.post('/', createPromotion);

// PUT /api/promotions/:id - Update promotion
router.put('/:id', updatePromotion);

// DELETE /api/promotions/:id - Delete promotion (soft delete)
router.delete('/:id', deletePromotion);

export default router;
