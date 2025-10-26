import express from 'express';
import {
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage
} from '../controllers/packageController.js';

const router = express.Router();

// GET /api/packages - Get all active packages
router.get('/', getAllPackages);

// GET /api/packages/:id - Get package by ID
router.get('/:id', getPackageById);

// POST /api/packages - Create new package
router.post('/', createPackage);

// PUT /api/packages/:id - Update package
router.put('/:id', updatePackage);

// DELETE /api/packages/:id - Delete package (soft delete)
router.delete('/:id', deletePackage);

export default router;
