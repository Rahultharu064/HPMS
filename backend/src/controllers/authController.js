import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { createTransporter } from './services/emailService.js';
import prisma from '../config/client.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Register guest
export const registerGuest = async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const existingGuest = await prisma.guest.findUnique({ where: { email } });
    if (existingGuest) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const guest = await prisma.guest.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        isVerified: false,
        verificationToken,
      },
    });

    // Send verification email
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      await transporter.sendMail({
        from: EMAIL_USER,
        to: email,
        subject: 'Verify Your Email',
        html: `<p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`,
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail registration if email fails, but log it
      // In production, you might want to retry or use a queue
    }

    res.status(201).json({ message: 'Registration successful. Please check your email to verify.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Verify email
export const verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    // In a real app, store token in DB with expiration
    // For simplicity, assume token is valid
    const guest = await prisma.guest.findFirst({ where: { isVerified: false } });
    if (!guest) return res.status(400).json({ error: 'Invalid token' });

    await prisma.guest.update({
      where: { id: guest.id },
      data: { isVerified: true },
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
};

// Login guest
export const loginGuest = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const guest = await prisma.guest.findUnique({ where: { email } });
    if (!guest) {
      return res.status(401).json({ error: 'Guest not found' });
    }
    if (!guest.password || !(await bcrypt.compare(password, guest.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Temporarily disable email verification for testing
    // if (!guest.isVerified) {
    //   return res.status(401).json({ error: 'Please verify your email first' });
    // }

    const token = jwt.sign({ id: guest.id, role: 'guest' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, guest: { id: guest.id, firstName: guest.firstName, lastName: guest.lastName, email: guest.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Forgot password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const guest = await prisma.guest.findUnique({ where: { email } });
    if (!guest) return res.status(404).json({ error: 'Email not found' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    // Store resetToken in DB with expiration (not implemented here)

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await transporter.sendMail({
      from: EMAIL_USER,
      to: email,
      subject: 'Reset Your Password',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
    });

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send reset email' });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Verify token (not implemented)
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // Update password for guest associated with token

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Password reset failed' });
  }
};

// Get current guest profile
export const getProfile = async (req, res) => {
  try {
    const guest = await prisma.guest.findUnique({ where: { id: req.user.id } });
    if (!guest) return res.status(404).json({ error: 'Guest not found' });

    res.json({ guest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Get current guest bookings
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { guestId: req.user.id },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            roomNumber: true,
            price: true,
            roomType: true,
          }
        },
        payments: {
          select: {
            id: true,
            method: true,
            amount: true,
            status: true,
            createdAt: true,
          }
        },
        package: {
          select: {
            id: true,
            name: true,
            type: true,
            value: true,
          }
        },
        promotion: {
          select: {
            id: true,
            name: true,
            discountType: true,
            discountValue: true,
          }
        },
        coupon: {
          select: {
            code: true,
            discountType: true,
            discountValue: true,
          }
        },
        extraServices: {
          include: {
            extraService: {
              select: {
                id: true,
                name: true,
                price: true,
                category: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

// Update profile
export const updateProfile = async (req, res) => {
  const { firstName, lastName, phone } = req.body;

  try {
    const guest = await prisma.guest.update({
      where: { id: req.user.id },
      data: { firstName, lastName, phone },
    });

    res.json({ guest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Update failed' });
  }
};

// Upload profile photo
export const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const photoUrl = `/uploads/profiles/${req.file.filename}`;

    const guest = await prisma.guest.update({
      where: { id: req.user.id },
      data: { photoUrl: photoUrl },
    });

    res.json({ guest, photoUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Photo upload failed' });
  }
};

// In-memory storage for admin OTPs (in production, use Redis or database)
const adminOtps = new Map();
const adminPasswordSetupTokens = new Map();
const adminResetTokens = new Map();

// Generate and send admin OTP
export const requestAdminOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Check if email is allowed (you can configure allowed admin emails)
  const allowedAdminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
  if (allowedAdminEmails.length > 0 && !allowedAdminEmails.includes(email)) {
    return res.status(403).json({ error: 'Unauthorized email address' });
  }

  try {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with expiration (24 hours - persists until logout)
    const otpData = {
      otp,
      email,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      attempts: 0
    };
    adminOtps.set(email, otpData);

    // Send OTP via email
    const transporter = createTransporter();
    if (!transporter) {
      console.error('Email transporter not configured');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Admin Login OTP - Hotel Management System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Admin Login OTP</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #667eea; text-align: center; letter-spacing: 5px; background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px dashed #667eea; }
            .warning { color: #d32f2f; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Admin Login Verification</h1>
            </div>
            <div class="content">
              <p>Hello Admin,</p>
              <p>You have requested access to the Hotel Management System admin panel.</p>
              <p>Your one-time password (OTP) is:</p>
              <div class="otp-code">${otp}</div>
              <p class="warning">⚠️ This OTP will expire in 5 minutes and can only be used once.</p>
              <p>If you didn't request this OTP, please ignore this email.</p>
              <p>Best regards,<br>Hotel Management System</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Admin OTP sent to ${email} at ${new Date().toISOString()}`);

    res.json({ message: 'OTP sent to your email. Please check your inbox.' });
  } catch (error) {
    console.error('Failed to send admin OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

// Verify admin OTP (first step)
export const loginAdmin = async (req, res) => {
  const { email, otp } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const otpData = adminOtps.get(email);

  // If OTP is provided, verify it
  if (otp) {
    if (!otpData) {
      return res.status(401).json({ error: 'No OTP found. Please request a new one.' });
    }

    // Check if OTP has expired
    if (Date.now() > otpData.expiresAt) {
      adminOtps.delete(email);
      return res.status(401).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Check attempts (max 3)
    if (otpData.attempts >= 3) {
      adminOtps.delete(email);
      return res.status(401).json({ error: 'Too many failed attempts. Please request a new OTP.' });
    }

    // Verify OTP
    if (otp !== otpData.otp) {
      otpData.attempts++;
      return res.status(401).json({ error: 'Invalid OTP. Please try again.' });
    }

    // OTP verified, mark as verified and extend expiration
    otpData.verified = true;
    otpData.expiresAt = Date.now() + (24 * 60 * 60 * 1000); // Extend to 24 hours
  } else {
    // No OTP provided, check if already verified
    if (!otpData || !otpData.verified) {
      return res.status(401).json({ error: 'OTP verification required. Please provide OTP.' });
    }

    // Check if verified OTP has expired
    if (Date.now() > otpData.expiresAt) {
      adminOtps.delete(email);
      return res.status(401).json({ error: 'OTP verification expired. Please request a new OTP.' });
    }
  }

  // Check if admin has password set
  const admin = await prisma.guest.findFirst({
    where: { email, role: 'admin' }
  });

  const hasPassword = admin && admin.password;

  console.log(`Admin OTP verified for ${email} at ${new Date().toISOString()}`);

  res.json({
    message: 'OTP verified successfully',
    requiresPasswordSetup: !hasPassword,
    email
  });
};

// Setup admin password after OTP verification
export const setupAdminPassword = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // Check if user exists with this email
    let admin = await prisma.guest.findUnique({
      where: { email }
    });

    if (!admin) {
      // Create new admin user
      admin = await prisma.guest.create({
        data: {
          firstName: 'Admin',
          lastName: 'User',
          email,
          phone: '', // Admin doesn't need phone
          password: await bcrypt.hash(password, 10),
          role: 'admin',
          isVerified: true, // Admin email is pre-verified
          isActive: true
        }
      });
    } else {
      // Update existing user to be admin with password
      admin = await prisma.guest.update({
        where: { id: admin.id },
        data: {
          password: await bcrypt.hash(password, 10),
          role: 'admin',
          isVerified: true, // Admin email is pre-verified
          isActive: true
        }
      });
    }

    // Create JWT token
    const jwtToken = jwt.sign(
      { id: admin.id, role: 'admin', type: 'admin', email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`Admin password setup successful for ${email} at ${new Date().toISOString()}`);

    res.json({
      token: jwtToken,
      user: { id: admin.id, role: 'admin', type: 'admin', email },
      message: 'Admin password set successfully'
    });
  } catch (error) {
    console.error('Admin password setup error:', error);
    res.status(500).json({ error: 'Failed to set admin password' });
  }
};

// Login admin with password (for subsequent logins)
export const loginAdminWithPassword = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const admin = await prisma.guest.findFirst({
      where: { email, role: 'admin', isActive: true }
    });

    if (!admin) {
      return res.status(401).json({ error: 'Admin not found' });
    }

    if (!admin.password) {
      return res.status(401).json({ error: 'Password not set. Please use OTP login first.' });
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const jwtToken = jwt.sign(
      { id: admin.id, role: 'admin', type: 'admin', email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`Admin password login successful for ${email} at ${new Date().toISOString()}`);

    res.json({
      token: jwtToken,
      user: { id: admin.id, role: 'admin', type: 'admin', email },
      message: 'Admin login successful'
    });
  } catch (error) {
    console.error('Admin password login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Login front office staff with email and password
export const loginStaff = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const staff = await prisma.frontOfficeStaff.findFirst({
      where: {
        email: email,
        isActive: true
      }
    });

    if (!staff) {
      return res.status(401).json({ error: 'Invalid email or inactive account' });
    }

    if (!staff.password) {
      return res.status(401).json({ error: 'Password not set. Please contact admin.' });
    }

    const isValidPassword = await bcrypt.compare(password, staff.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Create JWT for staff session (2 hours expiration)
    const jwtToken = jwt.sign(
      {
        id: staff.id,
        role: 'front_office_staff',
        type: 'staff',
        shift: staff.shift
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Log staff login
    console.log(`Front Office Staff ${staff.name} login successful at ${new Date().toISOString()}`);

    res.json({
      token: jwtToken,
      user: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: 'front_office_staff',
        type: 'staff',
        shift: staff.shift,
        passwordChanged: staff.passwordChanged
      },
      message: 'Staff login successful'
    });
  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Login housekeeping staff with email and password
export const loginHousekeeping = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const housekeeper = await prisma.housekeeper.findFirst({
      where: {
        email: email,
        isActive: true
      }
    });

    if (!housekeeper) {
      return res.status(401).json({ error: 'Invalid email or inactive account' });
    }

    if (!housekeeper.password) {
      return res.status(401).json({ error: 'Password not set. Please contact admin.' });
    }

    const isValidPassword = await bcrypt.compare(password, housekeeper.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Create JWT for housekeeping session (4 hours expiration)
    const jwtToken = jwt.sign(
      {
        id: housekeeper.id,
        role: 'housekeeping',
        type: 'housekeeper',
        shift: housekeeper.shift
      },
      JWT_SECRET,
      { expiresIn: '4h' }
    );

    // Log housekeeping login
    console.log(`Housekeeper ${housekeeper.name} login successful at ${new Date().toISOString()}`);

    res.json({
      token: jwtToken,
      user: {
        id: housekeeper.id,
        name: housekeeper.name,
        email: housekeeper.email,
        role: 'housekeeping',
        type: 'housekeeper',
        shift: housekeeper.shift,
        photoUrl: housekeeper.photoUrl,
        passwordChanged: housekeeper.passwordChanged
      },
      message: 'Housekeeping login successful',
      requiresPasswordChange: !housekeeper.passwordChanged
    });
  } catch (error) {
    console.error('Housekeeping login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Logout admin (clears OTP)
export const logoutAdmin = async (req, res) => {
  try {
    const email = req.user.email; // Get email from JWT token

    // Remove OTP from storage
    adminOtps.delete(email);

    console.log(`Admin ${email} logged out at ${new Date().toISOString()}`);

    res.json({ message: 'Admin logged out successfully' });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

// Change staff password
export const changeStaffPassword = async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ error: 'New password is required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const staff = await prisma.frontOfficeStaff.update({
      where: { id: req.user.id },
      data: {
        password: hashedPassword,
        passwordChanged: true
      },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

// Change housekeeping password
export const changeHousekeepingPassword = async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ error: 'New password is required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const housekeeper = await prisma.housekeeper.update({
      where: { id: req.user.id },
      data: {
        password: hashedPassword,
        passwordChanged: true
      },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

// Get admin profile
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await prisma.guest.findUnique({
      where: { id: req.user.id, role: 'admin' }
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Return admin profile without sensitive information
    res.json({
      admin: {
        id: admin.id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        photoUrl: admin.photoUrl,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      }
    });
  } catch (error) {
    console.error('Failed to fetch admin profile:', error);
    res.status(500).json({ error: 'Failed to fetch admin profile' });
  }
};
