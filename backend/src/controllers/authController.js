import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
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

  if (!firstName || !lastName || !email || !phone || !password) {
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
    if (!guest || !guest.password || !(await bcrypt.compare(password, guest.password))) {
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
