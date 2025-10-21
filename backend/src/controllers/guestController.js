import prisma from "../config/client.js";

// Get all guests with pagination and search
export const getAllGuests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;
    const { search, email, phone } = req.query;

    // Build where clause
    const where = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } }
      ];
    }
    if (email) where.email = { contains: email, mode: "insensitive" };
    if (phone) where.phone = { contains: phone, mode: "insensitive" };

    const [guests, total] = await Promise.all([
      prisma.guest.findMany({
        where,
        include: {
          bookings: {
            include: {
              room: { include: { image: true } },
              payments: true
            },
            orderBy: { createdAt: 'desc' }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.guest.count({ where })
    ]);

    res.json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      data: guests
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch guests" });
  }
};

// Upload or update guest profile photo
export const uploadGuestPhoto = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid guest id' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No photo uploaded' });
    }

    const updated = await prisma.guest.update({
      where: { id },
      data: { photoUrl: req.file.path ?? req.file.filename ?? '' }
    });

    res.json({ success: true, guest: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to upload photo' });
  }
};

// Get guest by ID
export const getGuestById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid guest id' });
    }

    const guest = await prisma.guest.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            room: { 
              include: { 
                image: true, 
                video: true, 
                amenity: true 
              } 
            },
            payments: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!guest) {
      return res.status(404).json({ success: false, error: 'Guest not found' });
    }

    // Insights
    const totalSpend = guest.bookings
      .filter(b => ['confirmed', 'completed'].includes(b.status))
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalNights = guest.bookings.reduce((sum, b) => {
      const ms = new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime();
      const nights = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
      return sum + nights;
    }, 0);
    const memberSince = guest.createdAt;

    res.json({ 
      success: true, 
      guest: {
        ...guest,
        insights: {
          totalSpend,
          totalNights,
          memberSince,
          loyaltyLevel: guest.loyaltyLevel || 'silver',
          vip: !!guest.vip
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch guest' });
  }
};

// Create new guest
export const createGuest = async (req, res) => {
  try {
    const body = req.validatedBody ?? req.body;

    // Check if guest already exists
    const existingByEmail = await prisma.guest.findUnique({ where: { email: body.email } });
    const existingByPhone = await prisma.guest.findUnique({ where: { phone: body.phone } });

    if (existingByEmail || existingByPhone) {
      return res.status(409).json({ 
        success: false, 
        error: 'Guest with this email or phone already exists' 
      });
    }

    const guest = await prisma.guest.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
      }
    });

    res.status(201).json({ success: true, guest });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'Email or phone already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to create guest' });
  }
};

// Update guest
export const updateGuest = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.validatedBody ?? req.body;

    // Check if guest exists
    const existingGuest = await prisma.guest.findUnique({ where: { id } });
    if (!existingGuest) {
      return res.status(404).json({ success: false, error: 'Guest not found' });
    }

    // Check for email/phone conflicts
    if (body.email && body.email !== existingGuest.email) {
      const emailExists = await prisma.guest.findUnique({ where: { email: body.email } });
      if (emailExists) {
        return res.status(409).json({ success: false, error: 'Email already exists' });
      }
    }

    if (body.phone && body.phone !== existingGuest.phone) {
      const phoneExists = await prisma.guest.findUnique({ where: { phone: body.phone } });
      if (phoneExists) {
        return res.status(409).json({ success: false, error: 'Phone already exists' });
      }
    }

    const updatedGuest = await prisma.guest.update({
      where: { id },
      data: {
        ...(body.firstName && { firstName: body.firstName }),
        ...(body.lastName && { lastName: body.lastName }),
        ...(body.email && { email: body.email }),
        ...(body.phone && { phone: body.phone }),
        updatedAt: new Date()
      },
      include: {
        bookings: {
          include: {
            room: { include: { image: true, video: true, amenity: true } },
            payments: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json({ success: true, guest: updatedGuest });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'Email or phone already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to update guest' });
  }
};

// Create or update guest by email/phone
export const upsertGuest = async (req, res) => {
  try {
    const body = req.validatedBody ?? req.body;

    // Try by email first, then by phone
    const existingByEmail = await prisma.guest.findUnique({ where: { email: body.email } });
    const existingByPhone = await prisma.guest.findUnique({ where: { phone: body.phone } });

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
          updatedAt: new Date()
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

    res.status(200).json({ success: true, guest });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'Email or phone already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to upsert guest' });
  }
};

// Get all bookings for a guest
export const getGuestBookings = async (req, res) => {
  try {
    const guestId = Number(req.params.id);
    if (!Number.isFinite(guestId) || guestId <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid guest id' });
    }

    const bookings = await prisma.booking.findMany({
      where: { guestId },
      include: {
        room: { 
          include: { 
            image: true, 
            video: true, 
            amenity: true 
          } 
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch guest bookings' });
  }
};

// Delete guest
export const deleteGuest = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const guest = await prisma.guest.findUnique({
      where: { id },
      include: { bookings: true }
    });

    if (!guest) {
      return res.status(404).json({ success: false, error: 'Guest not found' });
    }

    // Check if guest has bookings
    if (guest.bookings.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete guest with existing bookings' 
      });
    }

    await prisma.guest.delete({
      where: { id }
    });

    res.json({ 
      success: true, 
      message: 'Guest deleted successfully' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to delete guest' });
  }
};

// Get guest statistics
export const getGuestStats = async (req, res) => {
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
      totalGuests,
      newGuests,
      returningGuests,
      totalBookings,
      totalRevenue
    ] = await Promise.all([
      prisma.guest.count({ where }),
      prisma.guest.count({ 
        where: { 
          ...where,
          bookings: { some: {} }
        } 
      }),
      prisma.guest.count({ 
        where: { 
          ...where,
          bookings: { 
            some: {},
            _count: { gt: 1 }
          }
        } 
      }),
      prisma.booking.count({ 
        where: { 
          guest: where,
          status: { in: ['confirmed', 'completed'] }
        } 
      }),
      prisma.booking.aggregate({
        where: { 
          guest: where,
          status: { in: ['confirmed', 'completed'] }
        },
        _sum: { totalAmount: true }
      })
    ]);

    res.json({
      success: true,
      stats: {
        totalGuests,
        newGuests,
        returningGuests,
        totalBookings,
        totalRevenue: totalRevenue._sum.totalAmount || 0
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch guest statistics' });
  }
};

// Search guests
export const searchGuests = async (req, res) => {
  try {
    const { query } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    if (!query || query.length < 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'Search query must be at least 2 characters' 
      });
    }

    const guests = await prisma.guest.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } }
        ]
      },
      include: {
        bookings: {
          include: {
            room: { include: { image: true } },
            payments: true
          },
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: guests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to search guests' });
  }
};
