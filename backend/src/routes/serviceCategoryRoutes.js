import express from 'express';
const router = express.Router();
import serviceCategoryController from '../controllers/serviceCategoryController.js';

// Debug/test route to verify routes are loading
router.get('/debug', (req, res) => {
  console.log('Service category debug route hit');
  res.json({
    message: 'Service category routes are loaded',
    routes: ['GET /api/service-categories', 'POST /api/service-categories', 'PUT /api/service-categories/:id', 'DELETE /api/service-categories/:id']
  });
});

// Service category CRUD routes
router.get('/', serviceCategoryController.getServiceCategories);
router.post('/', serviceCategoryController.createServiceCategory);
router.put('/:id', serviceCategoryController.updateServiceCategory);
router.delete('/:id', serviceCategoryController.deleteServiceCategory);

export default router;
