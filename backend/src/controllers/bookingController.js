import prisma from "../config/client.js";

const diffNights = (checkIn, checkOut) => {
  const ms = checkOut.getTime() - checkIn.getTime();
  const nights = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return Math.max(nights, 1);
};

// Get all bookings with pagination and filters
export const getAllBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;
    const { status, guestName, roomId, checkIn, checkOut } = req.query;

    // Build where clause
    const where = {};
    if (status) where.status = status;
    if (roomId) where.roomId = parseInt(roomId);
    if (checkIn) where.checkIn = { gte: new Date(checkIn) };
    if (checkOut) where.checkOut = { lte: new Date(checkOut) };

    // Guest name search
    if (guestName) {
      where.guest = {
        OR: [
          { firstName: { contains: guestName, mode: "insensitive" } },
          { lastName: { contains: guestName, mode: "insensitive" } },
          { email: { contains: guestName, mode: "insensitive" } }
        ]
      };
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          guest: true,
          room: { include: { image: true, video: true } },
          payments: true
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
      where: { id },
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

    // Upsert guest by email/phone
    const existingByEmail = await prisma.guest.findUnique({ where: { email: body.email } }).catch(() => null);
    const existingByPhone = await prisma.guest.findUnique({ where: { phone: body.phone } }).catch(() => null);
    let guest;
    if (existingByEmail || existingByPhone) {
      const id = (existingByEmail ?? existingByPhone).id;
      guest = await prisma.guest.update({
        where: { id },
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          phone: body.phone,
        }
      });
    } else {
      guest = await prisma.guest.create({
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          phone: body.phone,
        }
      });
    }

    // Compute totals (server-side authoritative)
    const nights = diffNights(checkIn, checkOut);
    const totalAmount = nights * room.price;

    // Create booking and initial payment record in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          guestId: guest.id,
          roomId: room.id,
          checkIn,
          checkOut,
          adults: body.adults,
          children: body.children ?? 0,
          totalAmount,
          status: 'pending',
        },
      });

      const payment = await tx.payment.create({
        data: {
          bookingId: booking.id,
          method: body.paymentMethod ?? 'Cash',
          amount: totalAmount,
          status: 'pending',
        },
      });

      return { booking, payment };
    });

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

    res.json({ success: true, booking: updatedBooking });
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

// Delete booking
export const deleteBooking = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { payments: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Delete related payments first
    if (booking.payments.length > 0) {
      await prisma.payment.deleteMany({
        where: { bookingId: id }
      });
    }

    // Delete booking
    await prisma.booking.delete({
      where: { id }
    });

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
    
    const where = {};
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
