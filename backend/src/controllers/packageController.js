import prisma from "../config/client.js";

// Get all packages
export const getAllPackages = async (req, res) => {
  try {
    const packages = await prisma.package.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, packages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch packages' });
  }
};

// Get package by ID
export const getPackageById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid package id' });
    }

    const packageData = await prisma.package.findUnique({
      where: { id, active: true }
    });

    if (!packageData) {
      return res.status(404).json({ success: false, error: 'Package not found' });
    }

    res.json({ success: true, package: packageData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch package' });
  }
};

// Create package
export const createPackage = async (req, res) => {
  try {
    const { name, description, type, value, validFrom, validTo } = req.body;

    if (!name || !type || value === undefined) {
      return res.status(400).json({ success: false, error: 'Name, type, and value are required' });
    }

    if (!['fixed', 'percent'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Type must be either "fixed" or "percent"' });
    }

    if (type === 'percent' && (value < 0 || value > 100)) {
      return res.status(400).json({ success: false, error: 'Percentage value must be between 0 and 100' });
    }

    if (type === 'fixed' && value < 0) {
      return res.status(400).json({ success: false, error: 'Fixed value must be non-negative' });
    }

    const packageData = await prisma.package.create({
      data: {
        name,
        description,
        type,
        value: parseFloat(value),
        validFrom: new Date(validFrom),
        validTo: new Date(validTo)
      }
    });

    res.status(201).json({ success: true, package: packageData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to create package' });
  }
};

// Update package
export const updatePackage = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description, type, value, validFrom, validTo, active } = req.body;

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid package id' });
    }

    const existingPackage = await prisma.package.findUnique({ where: { id } });
    if (!existingPackage) {
      return res.status(404).json({ success: false, error: 'Package not found' });
    }

    if (type && !['fixed', 'percent'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Type must be either "fixed" or "percent"' });
    }

    if (type === 'percent' && value !== undefined && (value < 0 || value > 100)) {
      return res.status(400).json({ success: false, error: 'Percentage value must be between 0 and 100' });
    }

    if (type === 'fixed' && value !== undefined && value < 0) {
      return res.status(400).json({ success: false, error: 'Fixed value must be non-negative' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (value !== undefined) updateData.value = parseFloat(value);
    if (validFrom !== undefined) updateData.validFrom = new Date(validFrom);
    if (validTo !== undefined) updateData.validTo = new Date(validTo);
    if (active !== undefined) updateData.active = active;
    updateData.updatedAt = new Date();

    const packageData = await prisma.package.update({
      where: { id },
      data: updateData
    });

    res.json({ success: true, package: packageData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update package' });
  }
};

// Delete package (soft delete by setting active to false)
export const deletePackage = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid package id' });
    }

    const existingPackage = await prisma.package.findUnique({ where: { id } });
    if (!existingPackage) {
      return res.status(404).json({ success: false, error: 'Package not found' });
    }

    await prisma.package.update({
      where: { id },
      data: { active: false, updatedAt: new Date() }
    });

    res.json({ success: true, message: 'Package deactivated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to delete package' });
  }
};
