import prisma from "../config/client.js";

// Create a new extra service
const createExtraService = async (req, res) => {
    try {
        const { name, description, price, categoryId } = req.body;
        const image = req.file ? `/uploads/images/${req.file.filename}` : null;

        // Validate required fields
        if (!name || !description || !price || !categoryId) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate category exists and is active
        const category = await prisma.serviceCategory.findUnique({
            where: { id: parseInt(categoryId) }
        });

        if (!category || !category.active) {
            return res.status(400).json({ error: 'Invalid or inactive category selected' });
        }

        // Check for duplicate name
        const existingService = await prisma.extraService.findFirst({
            where: { name: name, active: true }
        });

        if (existingService) {
            return res.status(400).json({ error: 'Service with this name already exists' });
        }

        const service = await prisma.extraService.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                categoryId: parseInt(categoryId),
                image,
                active: true
            }
        });

        res.status(201).json(service);
    } catch (error) {
        console.error('Error creating extra service:', error);
        res.status(500).json({ error: 'Failed to create extra service' });
    }
};

// Get all extra services
const getExtraServices = async (req, res) => {
    try {
        const services = await prisma.extraService.findMany({
            where: { active: true },
            include: {
                category: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(services);
    } catch (error) {
        console.error('Error fetching extra services:', error);
        res.status(500).json({ error: 'Failed to fetch extra services' });
    }
};

// Update an extra service
const updateExtraService = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, categoryId, active } = req.body;
        const image = req.file ? `/uploads/images/${req.file.filename}` : undefined;

        // Validate required fields if they are being updated
        if (name === '' || description === '' || price === '' || categoryId === '') {
            return res.status(400).json({ error: 'Fields cannot be empty' });
        }

        // If categoryId is provided, validate it
        if (categoryId) {
            const category = await prisma.serviceCategory.findUnique({
                where: { id: parseInt(categoryId) }
            });
            if (!category || !category.active) {
                return res.status(400).json({ error: 'Invalid or inactive category selected' });
            }
        }

        const updateData = {
            ...(name && { name }),
            ...(description && { description }),
            ...(price && { price: parseFloat(price) }),
            ...(categoryId && { categoryId: parseInt(categoryId) }),
            ...(image && { image }),
            ...(active !== undefined && { active: active === 'true' || active === true })
        };

        const service = await prisma.extraService.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        res.json(service);
    } catch (error) {
        console.error('Error updating extra service:', error);
        res.status(500).json({ error: 'Failed to update extra service' });
    }
};

// Delete an extra service (Soft delete)
const deleteExtraService = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.extraService.update({
            where: { id: parseInt(id) },
            data: { active: false }
        });

        res.json({ message: 'Extra service deactivated' });
    } catch (error) {
        console.error('Error deleting extra service:', error);
        res.status(500).json({ error: 'Failed to delete extra service' });
    }
};

// Add extra service to booking
const addExtraServiceToBooking = async (req, res) => {
    try {
        const { bookingId, extraServiceId, quantity } = req.body;

        const service = await prisma.extraService.findUnique({
            where: { id: parseInt(extraServiceId) }
        });

        if (!service) {
            return res.status(404).json({ error: 'Extra service not found' });
        }

        const unitPrice = service.price;
        const totalPrice = unitPrice * parseInt(quantity);

        const bookingExtraService = await prisma.bookingExtraService.create({
            data: {
                bookingId: parseInt(bookingId),
                extraServiceId: parseInt(extraServiceId),
                quantity: parseInt(quantity),
                unitPrice,
                totalPrice
            },
            include: {
                extraService: true
            }
        });

        res.status(201).json(bookingExtraService);
    } catch (error) {
        console.error('Error adding extra service to booking:', error);
        res.status(500).json({ error: 'Failed to add extra service to booking' });
    }
};

// Remove extra service from booking
const removeExtraServiceFromBooking = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.bookingExtraService.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Extra service removed from booking' });
    } catch (error) {
        console.error('Error removing extra service from booking:', error);
        res.status(500).json({ error: 'Failed to remove extra service from booking' });
    }
};

// Get extra services for a booking
const getBookingExtraServices = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const extraServices = await prisma.bookingExtraService.findMany({
            where: { bookingId: parseInt(bookingId) },
            include: {
                extraService: true
            }
        });

        res.json(extraServices);
    } catch (error) {
        console.error('Error fetching booking extra services:', error);
        res.status(500).json({ error: 'Failed to fetch booking extra services' });
    }
};

export default {
    createExtraService,
    getExtraServices,
    updateExtraService,
    deleteExtraService,
    addExtraServiceToBooking,
    removeExtraServiceFromBooking,
    getBookingExtraServices
};
