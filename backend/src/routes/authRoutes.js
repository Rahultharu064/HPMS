import express from 'express';
import {
  registerGuest,
  verifyEmail,
  loginGuest,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  uploadPhoto,
  getUserBookings,
  requestAdminOtp,
  loginAdmin,
  setupAdminPassword,
  loginAdminWithPassword,
  loginStaff,
  loginHousekeeping,
  logoutAdmin,
  getAdminProfile,
  changeStaffPassword,
  changeHousekeepingPassword,
  googleLogin,
  googleCallback,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + req.user.id + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1]);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Public routes
router.post('/guest/register', registerGuest);
router.get('/verify-email', verifyEmail);
router.post('/guest/login', loginGuest);
router.post('/guest/forgot-password', forgotPassword);
router.post('/guest/reset-password', resetPassword);

// Protected routes
router.get('/guest/profile', authenticate, getProfile);
router.put('/guest/profile', authenticate, updateProfile);
router.post('/guest/upload-photo', authenticate, upload.single('photo'), uploadPhoto);
router.get('/guest/bookings', authenticate, getUserBookings);

// Admin routes
router.post('/admin/request-otp', requestAdminOtp);
router.post('/admin/verify-otp', loginAdmin);
router.post('/admin/setup-password', setupAdminPassword);
router.post('/admin/login-password', loginAdminWithPassword);
router.post('/admin/logout', authenticate, logoutAdmin);
router.get('/admin/profile', authenticate, getAdminProfile);
router.post('/admin/upload-photo', authenticate, upload.single('photo'), uploadPhoto);

// Staff routes
router.post('/staff/login', loginStaff);
router.put('/staff/change-password', authenticate, changeStaffPassword);

// Housekeeping routes
router.post('/housekeeping/login', loginHousekeeping);
router.put('/housekeeping/change-password', authenticate, changeHousekeepingPassword);

// Google OAuth routes
router.get('/google', googleLogin);
router.get('/google/callback', googleCallback);

export default router;
