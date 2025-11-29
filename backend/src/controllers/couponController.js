import prisma from "../config/client.js";

// Get all coupons
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, coupons });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch coupons' });
  }
};

// Get coupon by ID
export const getCouponById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid coupon id' });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { id, active: true }
    });

    if (!coupon) {
      return res.status(404).json({ success: false, error: 'Coupon not found' });
    }

    res.json({ success: true, coupon });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch coupon' });
  }
};

// Validate coupon code
export const validateCoupon = async (req, res) => {
  try {
    const { code, roomId, totalAmount } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, error: 'Coupon code is required' });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code, active: true }
    });

    if (!coupon) {
      return res.status(404).json({ success: false, error: 'Invalid coupon code' });
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validTo) {
      return res.status(400).json({ success: false, error: 'Coupon is not valid at this time' });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, error: 'Coupon usage limit exceeded' });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percent') {
      discountAmount = (totalAmount * coupon.discountValue) / 100;
    } else {
      discountAmount = Math.min(coupon.discountValue, totalAmount);
    }

    res.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discountAmount * 100) / 100
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to validate coupon' });
  }
};

// Create coupon
export const createCoupon = async (req, res) => {
  try {
    const { code, description, discountType, discountValue, usageLimit, validFrom, validTo } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({ success: false, error: 'Code, discountType, and discountValue are required' });
    }

    if (!['fixed', 'percent'].includes(discountType)) {
      return res.status(400).json({ success: false, error: 'Discount type must be either "fixed" or "percent"' });
    }

    if (discountType === 'percent' && (discountValue < 0 || discountValue > 100)) {
      return res.status(400).json({ success: false, error: 'Percentage discount must be between 0 and 100' });
    }

    if (discountType === 'fixed' && discountValue < 0) {
      return res.status(400).json({ success: false, error: 'Fixed discount must be non-negative' });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue: parseFloat(discountValue),
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        validFrom: new Date(validFrom),
        validTo: new Date(validTo)
      }
    });

    res.status(201).json({ success: true, coupon });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'Coupon code already exists' });
    }
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to create coupon' });
  }
};

// Update coupon
export const updateCoupon = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { code, description, discountType, discountValue, usageLimit, validFrom, validTo, active } = req.body;

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid coupon id' });
    }

    const existingCoupon = await prisma.coupon.findUnique({ where: { id } });
    if (!existingCoupon) {
      return res.status(404).json({ success: false, error: 'Coupon not found' });
    }

    if (discountType && !['fixed', 'percent'].includes(discountType)) {
      return res.status(400).json({ success: false, error: 'Discount type must be either "fixed" or "percent"' });
    }

    if (discountType === 'percent' && discountValue !== undefined && (discountValue < 0 || discountValue > 100)) {
      return res.status(400).json({ success: false, error: 'Percentage discount must be between 0 and 100' });
    }

    if (discountType === 'fixed' && discountValue !== undefined && discountValue < 0) {
      return res.status(400).json({ success: false, error: 'Fixed discount must be non-negative' });
    }

    const updateData = {};
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (description !== undefined) updateData.description = description;
    if (discountType !== undefined) updateData.discountType = discountType;
    if (discountValue !== undefined) updateData.discountValue = parseFloat(discountValue);
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit ? parseInt(usageLimit) : null;
    if (validFrom !== undefined) updateData.validFrom = new Date(validFrom);
    if (validTo !== undefined) updateData.validTo = new Date(validTo);
    if (active !== undefined) updateData.active = active;
    updateData.updatedAt = new Date();

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData
    });

    res.json({ success: true, coupon });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'Coupon code already exists' });
    }
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update coupon' });
  }
};

// Delete coupon (soft delete)
export const deleteCoupon = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid coupon id' });
    }

    const existingCoupon = await prisma.coupon.findUnique({ where: { id } });
    if (!existingCoupon) {
      return res.status(404).json({ success: false, error: 'Coupon not found' });
    }

    await prisma.coupon.update({
      where: { id },
      data: { active: false, updatedAt: new Date() }
    });

    res.json({ success: true, message: 'Coupon deactivated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to delete coupon' });
  }
};

// Get coupon analytics
export const getCouponAnalytics = async (req, res) => {
  try {
    // Get all coupons with their bookings
    const coupons = await prisma.coupon.findMany({
      include: {
        bookings: {
          select: {
            id: true,
            discountAmount: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate analytics for each coupon
    const analytics = coupons.map(coupon => {
      const totalBookings = coupon.bookings.length;
      const completedBookings = coupon.bookings.filter(b => b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'checked_out').length;
      const totalDiscount = coupon.bookings.reduce((sum, b) => sum + (b.discountAmount || 0), 0);
      const usagePercentage = coupon.usageLimit ? (coupon.usedCount / coupon.usageLimit) * 100 : 0;

      return {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        usageLimit: coupon.usageLimit,
        usedCount: coupon.usedCount,
        validFrom: coupon.validFrom,
        validTo: coupon.validTo,
        active: coupon.active,
        totalBookings,
        completedBookings,
        totalDiscount: Math.round(totalDiscount * 100) / 100,
        usagePercentage: Math.round(usagePercentage * 100) / 100
      };
    });

    // Calculate overall statistics
    const totalCoupons = coupons.length;
    const activeCoupons = coupons.filter(c => c.active).length;
    const totalUsed = coupons.reduce((sum, c) => sum + c.usedCount, 0);
    const totalDiscountGiven = analytics.reduce((sum, a) => sum + a.totalDiscount, 0);

    res.json({
      success: true,
      analytics,
      summary: {
        totalCoupons,
        activeCoupons,
        totalUsed,
        totalDiscountGiven: Math.round(totalDiscountGiven * 100) / 100
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch coupon analytics' });
  }
};
