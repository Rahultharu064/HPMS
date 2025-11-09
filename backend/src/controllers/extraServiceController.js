import prisma from "../config/client.js";

// Get all extra services
const getExtraServices = async (req, res) => {
  try {
    const services = await prisma.extraService.findMany({
      where: { active: true },
      orderBy: { name: 'asc' }
    });
    res.json(services);
  } catch (error) {
    console.error('Error fetching extra services:', error);
    res.status(500).json({ error: 'Failed to fetch extra services' });
  }
};

// Create a new extra service
const createExtraService = async (req, res) => {
  try {
    const { name, description, price, category } = req.body;

    const service = await prisma.extraService.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        category
      }
    });

    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating extra service:', error);
    res.status(500).json({ error: 'Failed to create extra service' });
  }
};

// Update an extra service
const updateExtraService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, active } = req.body;

    const service = await prisma.extraService.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        price: parseFloat(price),
        category,
        active
      }
    });

    res.json(service);
  } catch (error) {
    console.error('Error updating extra service:', error);
    res.status(500).json({ error: 'Failed to update extra service' });
  }
};

// Delete an extra service
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

    // Get the extra service to get its price
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

    if (!bookingId || isNaN(parseInt(bookingId))) {
      return res.json([]);
    }

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
  getExtraServices,
  createExtraService,
  updateExtraService,
  deleteExtraService,
  addExtraServiceToBooking,
  removeExtraServiceFromBooking,
  getBookingExtraServices
};
