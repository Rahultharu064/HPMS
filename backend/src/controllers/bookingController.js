import prisma from "../config/client.js";
import path from 'path'
import fs from 'fs'
import sharp from 'sharp'
import { createWorker } from 'tesseract.js'
import { getIO } from "../socket.js";
import { sendBookingSuccessEmail } from "./services/emailService.js";

// Helper function to create notification
const createNotification = async (type, message, sender = null, meta = null) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        type,
        message,
        sender,
        meta
      }
    });

    // Emit notification event via Socket.IO
    const io = getIO();
    io && io.emit('notification:new', { notification });

    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
};

const diffNights = (checkIn, checkOut) => {
  const ms = checkOut.getTime() - checkIn.getTime();
  const nights = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return Math.max(nights, 1);
};

// Helper: compute a simple perceptual hash (8x8 grayscale, DCT-like average threshold)
async function computeSimplePHash(filePath) {
  const size = 8
  const { data, info } = await sharp(filePath).resize(size, size).greyscale().raw().toBuffer({ resolveWithObject: true })
  const pixels = Array.from(data)
  const avg = pixels.reduce((a,b)=>a+b,0) / pixels.length
  let hash = 0n
  for (let i=0;i<pixels.length;i++) {
    if (pixels[i] >= avg) hash |= (1n << BigInt(i))
  }
  return hash
}

function hammingDistance(a, b) {
  let x = a ^ b
  let count = 0
  while (x) { x &= (x - 1n); count++; }
  return count
}

// Upload ID Proof image for a booking and log it
export const uploadIdProof = async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid booking id' })
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No idProof image uploaded' })
    }

    const booking = await prisma.booking.findUnique({ where: { id }, include: { guest: true } })
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' })

    // Validate image
    const MAX_BYTES = 5 * 1024 * 1024
    if (req.file.size && req.file.size > MAX_BYTES) {
      try { fs.unlinkSync(req.file.path) } catch {}
      return res.status(400).json({ success: false, error: 'Image too large (max 5MB)' })
    }
    try {
      const meta = await sharp(req.file.path).metadata()
      const allowedFormats = new Set(['jpeg','jpg','png','webp','gif'])
      const fmt = String(meta.format || '').toLowerCase()
      if (!allowedFormats.has(fmt)) {
        try { fs.unlinkSync(req.file.path) } catch {}
        return res.status(400).json({ success: false, error: 'Unsupported image format' })
      }
      const minW = 400, minH = 300
      if (!meta.width || !meta.height || meta.width < minW || meta.height < minH) {
        try { fs.unlinkSync(req.file.path) } catch {}
        return res.status(400).json({ success: false, error: `Image too small (min ${minW}x${minH})` })
      }
    } catch (e) {
      try { fs.unlinkSync(req.file.path) } catch {}
      return res.status(400).json({ success: false, error: 'Invalid image file' })
    }

    // Basic duplicate/similarity check vs guest profile photo (if exists)
    let similarity = null
    if (booking.guest?.photoUrl) {
      try {
        const guestPath = path.isAbsolute(booking.guest.photoUrl) ? booking.guest.photoUrl : path.join(process.cwd(), booking.guest.photoUrl)
        const h1 = await computeSimplePHash(guestPath)
        const h2 = await computeSimplePHash(req.file.path)
        const dist = Number(hammingDistance(h1, h2))
        similarity = 1 - (dist / 64) // 0..1
        // If images are nearly identical, reject: ID proof must be govt ID, not a face selfie
        if (similarity > 0.95) {
          try { fs.unlinkSync(req.file.path) } catch {}
          return res.status(400).json({ success: false, error: 'ID Proof appears identical to profile photo. Upload the government ID image.' })
        }
      } catch (_) { /* ignore similarity failures */ }
    }

    // Basic OCR processing for logging (optional - doesn't block upload)
    let ocrText = null
    let ocrConfidence = null
    try {
      const worker = await createWorker('eng')
      const { data: { text, confidence } } = await worker.recognize(req.file.path)
      await worker.terminate()
      ocrText = text.trim()
      ocrConfidence = confidence
    } catch (ocrErr) {
      console.warn('OCR processing failed:', ocrErr.message)
      // OCR failure does not block upload
    }

    // Store path in workflow log as an attachment reference
    const webPath = path.relative(process.cwd(), req.file.path ?? path.join(req.file.destination || 'uploads', req.file.filename || ''))
    const remarks = [
      similarity != null ? `similarity:${(similarity*100).toFixed(1)}%` : null,
      ocrConfidence != null ? `ocr_confidence:${ocrConfidence.toFixed(1)}%` : null
    ].filter(Boolean).join('; ') || undefined

    const log = await prisma.bookingWorkflowLog.create({
      data: {
        bookingId: booking.id,
        type: 'id-proof',
        signatureUrl: webPath,
        remarks
      }
    })

    return res.json({ success: true, log })
  } catch (err) {
    console.error('uploadIdProof error:', err)
    return res.status(500).json({ success: false, error: 'Failed to upload ID proof' })
  }
}

// Create a booking workflow log (check-in/check-out audit entry)
export const createBookingWorkflowLog = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const { type, idType, idNumber, remarks, signatureUrl, createdBy } = req.body || {};

    if (!bookingId || !['checkin', 'checkout'].includes(String(type))) {
      return res.status(400).json({ success: false, error: 'Invalid payload' });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const log = await prisma.bookingWorkflowLog.create({
      data: {
        bookingId,
        type: String(type),
        idType: idType || null,
        idNumber: idNumber || null,
        remarks: remarks || null,
        signatureUrl: signatureUrl || null,
        createdBy: createdBy || null,
      }
    });

    try {
      const io = getIO();
      io && io.emit('fo:booking:workflow', { bookingId, log });
    } catch {}

    res.status(201).json({ success: true, log });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to create workflow log' });
  }
};

// Get all bookings with pagination and filters
export const getAllBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;
    const { status, guestName, roomId, checkIn, checkOut } = req.query;

    // Build where clause
    const where = { deletedAt: null };
    if (status) where.status = status;
    if (roomId) where.roomId = parseInt(roomId);
    if (checkIn) where.checkIn = { gte: new Date(checkIn) };
    if (checkOut) where.checkOut = { lte: new Date(checkOut) };

    // Guest name/email search (relation filter)
    if (guestName) {
      const q = String(guestName)
      where.OR = [
        { guest: { is: { firstName: { contains: q } } } },
        { guest: { is: { lastName: { contains: q } } } },
        { guest: { is: { email: { contains: q } } } }
      ]
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          guest: true,
          room: { include: { image: true, video: true } },
          payments: true,
          extraServices: {
            include: {
              extraService: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.booking.count({ where })
    ]);

    res.json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      data: bookings
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch bookings" });
  }
};

// Get booking by ID
export const getBookingById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid booking id' });
    }
    const booking = await prisma.booking.findUnique({
      where: { id, deletedAt: null },
      include: {
        guest: true,
        room: {
          include: {
            image: true,
            video: true,
            amenity: true
          }
        },
        payments: true,
        extraServices: {
          include: {
            extraService: true
          }
        }
      }
    });
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
    res.json({ success: true, booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch booking' });
  }
};

export const createBooking = async (req, res) => {
  try {
    const body = req.validatedBody ?? req.body;

    // Parse dates
    const checkIn = new Date(body.checkIn);
    const checkOut = new Date(body.checkOut);
    if (isNaN(checkIn) || isNaN(checkOut) || !(checkOut > checkIn)) {
      return res.status(400).json({ success: false, error: 'Invalid dates' });
    }

    // Fetch room
    const room = await prisma.room.findUnique({ where: { id: Number(body.roomId) } });
    if (!room) return res.status(404).json({ success: false, error: 'Room not found' });

    // Capacity checks
    if (body.adults > room.maxAdults) {
      return res.status(400).json({ success: false, error: `Exceeds adult capacity (max ${room.maxAdults})` });
    }
    if (body.children > room.maxChildren) {
      return res.status(400).json({ success: false, error: `Exceeds children capacity (max ${room.maxChildren})` });
    }
    if (!room.allowChildren && body.children > 0) {
      return res.status(400).json({ success: false, error: 'Children not allowed in this room' });
    }

    // Availability: existing overlap check
    const overlapping = await prisma.booking.findFirst({
      where: {
        roomId: room.id,
        status: { in: ['pending', 'confirmed'] },
        AND: [
          { checkIn: { lt: checkOut } },
          { checkOut: { gt: checkIn } },
        ],
      },
    });
    if (overlapping) {
      return res.status(409).json({ success: false, error: 'Room not available for selected dates' });
    }

    // Find or create guest - use existing guest if email already exists, otherwise create new
    const guest = await prisma.guest.upsert({
      where: { email: body.email },
      update: {}, // No updates needed if guest exists
      create: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        nationality: body.nationality ?? null,
        idType: body.idType ?? null,
        idNumber: body.idNumber ?? null,
      }
    });

    // Compute totals (server-side authoritative) with packages/promotions/coupons
    const nights = diffNights(checkIn, checkOut);
    let baseAmount = nights * room.price;
    let discountAmount = 0;
    let packageId = null;
    let promotionId = null;
    let couponCode = null;

    // Apply package if provided
    if (body.packageId) {
      const pkg = await prisma.package.findUnique({
        where: { id: Number(body.packageId), active: true }
      });
      if (pkg && new Date() >= pkg.validFrom && new Date() <= pkg.validTo) {
        if (pkg.type === 'fixed') {
          baseAmount = pkg.value;
        } else if (pkg.type === 'percent') {
          baseAmount = baseAmount * (1 - pkg.value / 100);
        }
        packageId = pkg.id;
      }
    }

    // Apply promotion if provided
    if (body.promotionId) {
      const promo = await prisma.promotion.findUnique({
        where: { id: Number(body.promotionId), active: true }
      });
      if (promo && new Date() >= promo.validFrom && new Date() <= promo.validTo) {
        // Check if promotion applies to this room
        let applicableRooms = null;
        try {
          applicableRooms = promo.applicableRooms ? JSON.parse(promo.applicableRooms) : null;
        } catch (e) {
          console.warn('Invalid applicableRooms JSON for promotion:', promo.id, e.message);
          // If JSON is invalid, treat as no restrictions
        }
        if (!applicableRooms || applicableRooms.includes(room.id)) {
          if (promo.discountType === 'fixed') {
            discountAmount += promo.discountValue;
          } else if (promo.discountType === 'percent') {
            discountAmount += baseAmount * (promo.discountValue / 100);
          }
          promotionId = promo.id;
        }
      }
    }

    // Apply coupon if provided
    if (body.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: body.couponCode, active: true }
      });
      if (coupon && new Date() >= coupon.validFrom && new Date() <= coupon.validTo) {
        // Check usage limit
        if (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) {
          if (coupon.discountType === 'fixed') {
            discountAmount += coupon.discountValue;
          } else if (coupon.discountType === 'percent') {
            discountAmount += baseAmount * (coupon.discountValue / 100);
          }
          couponCode = coupon.code;
        }
      }
    }

    // Calculate final amounts
    const discountedAmount = Math.max(0, baseAmount - discountAmount);
    const taxAmount = discountedAmount * 0.13; // 13% tax
    const finalAmount = discountedAmount + taxAmount;

    // Create booking and initial payment record in a transaction
    const method = String(body.paymentMethod ?? 'cash').toLowerCase()
    const isInstantConfirm = ['cash', 'card'].includes(method)

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          guestId: guest.id,
          roomId: room.id,
          checkIn,
          checkOut,
          adults: body.adults,
          children: body.children ?? 0,
          totalAmount: finalAmount,
          discountAmount,
          packageId,
          promotionId,
          couponCode,
          status: isInstantConfirm ? 'confirmed' : 'pending',
        },
      });

      // Increment coupon usage if applied
      if (couponCode) {
        await tx.coupon.update({
          where: { code: couponCode },
          data: { usedCount: { increment: 1 } }
        });
      }

      let payment = null
      if (method === 'cash' || method === 'card') {
        payment = await tx.payment.create({
          data: {
            bookingId: booking.id,
            method,
            amount: finalAmount,
            status: 'completed',
          },
        });
      }

      // Log special request if provided
      if (body.specialRequest && String(body.specialRequest).trim().length) {
        await tx.bookingWorkflowLog.create({
          data: {
            bookingId: booking.id,
            type: 'special-request',
            remarks: String(body.specialRequest).slice(0, 1000)
          }
        })
      }

      return { booking, payment };
    });

    // Send booking success email for confirmed bookings
    if (result.booking.status === 'confirmed') {
      try {
        // Fetch the complete booking with guest and room data
        const completeBooking = await prisma.booking.findUnique({
          where: { id: result.booking.id },
          include: { guest: true, room: true }
        });
        if (completeBooking) {
          await sendBookingSuccessEmail(completeBooking);
        }
      } catch (emailError) {
        console.error('Failed to send booking success email:', emailError);
        // Don't fail the booking creation if email fails
      }
    }

    try {
      const io = getIO();
      io && io.emit('fo:booking:created', { booking: result.booking })

      // Create notification for new booking
      await createNotification(
        'booking',
        `New booking created for ${result.booking.guest.firstName} ${result.booking.guest.lastName} in room ${result.booking.room.roomNumber}`,
        'system',
        { bookingId: result.booking.id, type: 'new' }
      );
    } catch {}

    res.status(201).json({ success: true, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to create booking' });
  }
};

// Update booking
export const updateBooking = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.validatedBody ?? req.body;

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: { room: true }
    });

    if (!existingBooking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Parse dates if provided
    let checkIn = existingBooking.checkIn;
    let checkOut = existingBooking.checkOut;
    
    if (body.checkIn) {
      checkIn = new Date(body.checkIn);
      if (isNaN(checkIn)) {
        return res.status(400).json({ success: false, error: 'Invalid check-in date' });
      }
    }
    
    if (body.checkOut) {
      checkOut = new Date(body.checkOut);
      if (isNaN(checkOut)) {
        return res.status(400).json({ success: false, error: 'Invalid check-out date' });
      }
    }

    // Validate dates
    if (checkOut <= checkIn) {
      return res.status(400).json({ success: false, error: 'Check-out must be after check-in' });
    }

    // Check room availability if dates or room changed
    if (body.roomId || body.checkIn || body.checkOut) {
      const roomId = body.roomId ? Number(body.roomId) : existingBooking.roomId;
      
      const overlapping = await prisma.booking.findFirst({
        where: {
          roomId: roomId,
          id: { not: id },
          status: { in: ['pending', 'confirmed'] },
          AND: [
            { checkIn: { lt: checkOut } },
            { checkOut: { gt: checkIn } },
          ],
        },
      });

      if (overlapping) {
        return res.status(409).json({ success: false, error: 'Room not available for selected dates' });
      }
    }

    // Calculate new total amount if dates or room changed
    let totalAmount = existingBooking.totalAmount;
    if (body.roomId || body.checkIn || body.checkOut) {
      const room = await prisma.room.findUnique({ 
        where: { id: body.roomId ? Number(body.roomId) : existingBooking.roomId } 
      });
      if (!room) {
        return res.status(404).json({ success: false, error: 'Room not found' });
      }
      
      const nights = diffNights(checkIn, checkOut);
      totalAmount = nights * room.price;
    }

    // Guardrails: validate status transitions
    if (body.status) {
      const currentStatus = existingBooking.status;
      const nextStatus = String(body.status);
      const allowed = new Set(['pending', 'confirmed', 'completed', 'cancelled']);
      if (!allowed.has(nextStatus)) {
        return res.status(400).json({ success: false, error: 'Invalid status value' });
      }

      // Normalize date-only comparisons
      const toDateOnly = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const today = toDateOnly(new Date());
      const ci = toDateOnly(checkIn);
      const co = toDateOnly(checkOut);

      // Disallow changes from cancelled/completed except specific cases (no reopen)
      if (['cancelled', 'completed'].includes(currentStatus) && nextStatus !== currentStatus) {
        return res.status(400).json({ success: false, error: `Cannot change status from ${currentStatus}` });
      }

      // Check-in: pending -> confirmed, not before check-in date
      // Allow confirmed -> confirmed for workflow completion
      if (nextStatus === 'confirmed') {
        if (currentStatus !== 'pending' && currentStatus !== 'confirmed') {
          return res.status(400).json({ success: false, error: 'Invalid status for check-in' });
        }
        if (today < ci) {
          return res.status(400).json({ success: false, error: 'Cannot check in before check-in date' });
        }
      }

      // Check-out: confirmed -> completed, not before check-out date
      if (nextStatus === 'completed') {
        if (currentStatus !== 'confirmed') {
          return res.status(400).json({ success: false, error: 'Only confirmed bookings can be checked out' });
        }
        if (today < co) {
          return res.status(400).json({ success: false, error: 'Cannot check out before check-out date' });
        }
      }

      // Cancelling is allowed from pending/confirmed; handled below by update
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        ...(body.roomId && { roomId: Number(body.roomId) }),
        ...(body.checkIn && { checkIn }),
        ...(body.checkOut && { checkOut }),
        ...(body.adults && { adults: Number(body.adults) }),
        ...(body.children !== undefined && { children: Number(body.children) }),
        ...(body.status && { status: body.status }),
        ...(body.totalAmount && { totalAmount: Number(body.totalAmount) }),
        updatedAt: new Date()
      },
      include: {
        guest: true,
        room: { include: { image: true, video: true, amenity: true } },
        payments: true
      }
    });

    // Send booking success email if status changed to 'confirmed'
    if (body.status === 'confirmed' && existingBooking.status !== 'confirmed') {
      try {
        // Fetch the complete booking with guest and room data
        const completeBooking = await prisma.booking.findUnique({
          where: { id: updatedBooking.id },
          include: { guest: true, room: true }
        });
        if (completeBooking) {
          await sendBookingSuccessEmail(completeBooking);
        }
      } catch (emailError) {
        console.error('Failed to send booking success email:', emailError);
        // Don't fail the booking update if email fails
      }
    }

    try {
      const io = getIO();
      io && io.emit('fo:booking:updated', { booking: updatedBooking })

      // Create notification for booking status change
      if (body.status && body.status !== existingBooking.status) {
        await createNotification(
          'booking',
          `Booking status changed to ${body.status} for ${updatedBooking.guest.firstName} ${updatedBooking.guest.lastName} in room ${updatedBooking.room.roomNumber}`,
          'system',
          { bookingId: updatedBooking.id, type: 'status_change', oldStatus: existingBooking.status, newStatus: body.status }
        );
      }
    } catch {}

    let message = '';
    if (body.status === 'confirmed') {
      message = 'Check-in completed successfully';
    } else if (body.status === 'completed') {
      message = 'Check-out completed successfully';
    }

    res.json({ success: true, booking: updatedBooking, message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update booking' });
  }
};

// Cancel booking
export const cancelBooking = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { reason } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { payments: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, error: 'Booking already cancelled' });
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { 
        status: 'cancelled',
        updatedAt: new Date()
      },
      include: {
        guest: true,
        room: { include: { image: true, video: true, amenity: true } },
        payments: true
      }
    });

    // Update payment status if exists
    if (booking.payments.length > 0) {
      await prisma.payment.updateMany({
        where: { bookingId: id },
        data: { status: 'refunded' }
      });
    }

    try {
      const io = getIO();
      io && io.emit('fo:booking:cancelled', { booking: updatedBooking, reason: reason || null })
    } catch {}
    res.json({ 
      success: true, 
      booking: updatedBooking,
      message: 'Booking cancelled successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to cancel booking' });
  }
};

// Delete booking (soft delete)
export const deleteBooking = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const booking = await prisma.booking.findUnique({
      where: { id, deletedAt: null },
      include: { payments: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Soft delete booking
    await prisma.booking.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    try {
      const io = getIO();
      io && io.emit('fo:booking:deleted', { id })
    } catch {}

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to delete booking' });
  }
};

// Get booking statistics
export const getBookingStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = { deletedAt: null };
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      totalRevenue
    ] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.count({ where: { ...where, status: 'confirmed' } }),
      prisma.booking.count({ where: { ...where, status: 'pending' } }),
      prisma.booking.count({ where: { ...where, status: 'cancelled' } }),
      prisma.booking.aggregate({
        where: { ...where, status: { in: ['confirmed', 'completed'] } },
        _sum: { totalAmount: true }
      })
    ]);

    res.json({
      success: true,
      stats: {
        totalBookings,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
        totalRevenue: totalRevenue._sum.totalAmount || 0
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch booking statistics' });
  }
};
