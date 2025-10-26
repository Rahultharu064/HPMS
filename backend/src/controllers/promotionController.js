import prisma from "../config/client.js";

// Get all promotions
export const getAllPromotions = async (req, res) => {
  try {
    const promotions = await prisma.promotion.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, promotions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch promotions' });
  }
};

// Get promotion by ID
export const getPromotionById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid promotion id' });
    }

    const promotion = await prisma.promotion.findUnique({
      where: { id, active: true }
    });

    if (!promotion) {
      return res.status(404).json({ success: false, error: 'Promotion not found' });
    }

    res.json({ success: true, promotion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch promotion' });
  }
};

// Create promotion
export const createPromotion = async (req, res) => {
  try {
    const { name, description, discountType, discountValue, validFrom, validTo, applicableRooms } = req.body;

    if (!name || !discountType || discountValue === undefined) {
      return res.status(400).json({ success: false, error: 'Name, discountType, and discountValue are required' });
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

    const promotion = await prisma.promotion.create({
      data: {
        name,
        description,
        discountType,
        discountValue: parseFloat(discountValue),
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
        applicableRooms: applicableRooms ? JSON.stringify(applicableRooms) : null
      }
    });

    res.status(201).json({ success: true, promotion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to create promotion' });
  }
};

// Update promotion
export const updatePromotion = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description, discountType, discountValue, validFrom, validTo, applicableRooms, active } = req.body;

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid promotion id' });
    }

    const existingPromotion = await prisma.promotion.findUnique({ where: { id } });
    if (!existingPromotion) {
      return res.status(404).json({ success: false, error: 'Promotion not found' });
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
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (discountType !== undefined) updateData.discountType = discountType;
    if (discountValue !== undefined) updateData.discountValue = parseFloat(discountValue);
    if (validFrom !== undefined) updateData.validFrom = new Date(validFrom);
    if (validTo !== undefined) updateData.validTo = new Date(validTo);
    if (applicableRooms !== undefined) updateData.applicableRooms = applicableRooms ? JSON.stringify(applicableRooms) : null;
    if (active !== undefined) updateData.active = active;
    updateData.updatedAt = new Date();

    const promotion = await prisma.promotion.update({
      where: { id },
      data: updateData
    });

    res.json({ success: true, promotion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update promotion' });
  }
};

// Delete promotion (soft delete)
export const deletePromotion = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid promotion id' });
    }

    const existingPromotion = await prisma.promotion.findUnique({ where: { id } });
    if (!existingPromotion) {
      return res.status(404).json({ success: false, error: 'Promotion not found' });
    }

    await prisma.promotion.update({
      where: { id },
      data: { active: false, updatedAt: new Date() }
    });

    res.json({ success: true, message: 'Promotion deactivated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to delete promotion' });
  }
};
