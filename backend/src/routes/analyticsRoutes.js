import express from 'express';
import { getDashboardAnalytics } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Dashboard analytics (protected route for admin/owner)
router.get('/dashboard', authenticate, getDashboardAnalytics);

export default router;
