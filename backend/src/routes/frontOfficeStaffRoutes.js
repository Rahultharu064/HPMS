import express from 'express'
import { authenticate as authenticateToken, authorize as requireRole } from '../middleware/auth.js'
import {
  listFrontOfficeStaff,
  getFrontOfficeStaff,
  createFrontOfficeStaff,
  updateFrontOfficeStaff,
  deleteFrontOfficeStaff,
  resetFrontOfficeStaffPassword
} from '../controllers/frontOfficeStaffController.js'
import multer from 'multer'

const router = express.Router()

// Configure multer for file uploads (if needed in future)
const upload = multer({ dest: 'uploads/' })

// All routes require authentication and admin role
router.use(authenticateToken)
router.use(requireRole(['admin', 'owner']))

// Routes
router.get('/', listFrontOfficeStaff)
router.get('/:id', getFrontOfficeStaff)
router.post('/', createFrontOfficeStaff)
router.put('/:id', updateFrontOfficeStaff)
router.delete('/:id', deleteFrontOfficeStaff)
router.post('/:id/reset-password', resetFrontOfficeStaffPassword)

export default router
