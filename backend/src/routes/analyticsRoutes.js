import express from 'express';
import { getDashboardAnalytics, getPublicStats } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public stats for register page (no authentication required)
router.get('/public-stats', getPublicStats);

// Dashboard analytics (protected route for admin/owner)
router.get('/dashboard', authenticate, getDashboardAnalytics);

export default router;
