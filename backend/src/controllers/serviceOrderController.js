import prisma from "../config/client.js";
import { getIO } from "../socket.js";

// Create a new service order
export const createServiceOrder = async (req, res) => {
    try {
        const body = req.body;

        // Validate required fields
        if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
            return res.status(400).json({ success: false, error: 'No service items provided' });
        }

        // Find or create guest
        let guestId = body.guestId;
        if (!guestId) {
            if (!body.guest || !body.guest.email || !body.guest.firstName || !body.guest.lastName) {
                return res.status(400).json({ success: false, error: 'Guest details required' });
            }

            const guest = await prisma.guest.upsert({
                where: { email: body.guest.email },
                update: {
                    firstName: body.guest.firstName,
                    lastName: body.guest.lastName,
                    phone: body.guest.phone || undefined
                },
                create: {
                    firstName: body.guest.firstName,
                    lastName: body.guest.lastName,
                    email: body.guest.email,
                    phone: body.guest.phone,
                    role: 'guest'
                }
            });
            guestId = guest.id;
        }

        // Calculate totals and validate items
        let totalAmount = 0;
        const orderItems = [];

        for (const item of body.items) {
            const extraService = await prisma.extraService.findUnique({
                where: { id: Number(item.extraServiceId) }
            });

            if (!extraService) {
                return res.status(400).json({ success: false, error: `Service not found: ${item.extraServiceId}` });
            }

            const quantity = Number(item.quantity) || 1;
            const unitPrice = extraService.price;
            const itemTotal = unitPrice * quantity;

            totalAmount += itemTotal;
            orderItems.push({
                extraServiceId: extraService.id,
                quantity,
                unitPrice,
                totalPrice: itemTotal
            });
        }

        // Create order in transaction
        const serviceOrder = await prisma.$transaction(async (tx) => {
            const order = await tx.serviceOrder.create({
                data: {
                    guestId,
                    totalAmount,
                    status: 'pending',
                    items: {
                        create: orderItems
                    }
                },
                include: {
                    guest: true,
                    items: {
                        include: {
                            extraService: true
                        }
                    }
                }
            });

            return order;
        });

        try {
            const io = getIO();
            io && io.emit('fo:service-order:created', { serviceOrder });
        } catch { }

        res.status(201).json({ success: true, serviceOrder });

    } catch (err) {
        console.error('createServiceOrder error:', err);
        res.status(500).json({ success: false, error: 'Failed to create service order' });
    }
};

// Get all service orders
export const getAllServiceOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const skip = (page - 1) * limit;
        const { status, guestName, startDate, endDate } = req.query;

        const where = {};
        if (status) where.status = status;
        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }
        if (guestName) {
            where.guest = {
                OR: [
                    { firstName: { contains: guestName } },
                    { lastName: { contains: guestName } },
                    { email: { contains: guestName } }
                ]
            };
        }

        const [orders, total] = await Promise.all([
            prisma.serviceOrder.findMany({
                where,
                include: {
                    guest: true,
                    items: {
                        include: {
                            extraService: true
                        }
                    },
                    payments: true
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.serviceOrder.count({ where })
        ]);

        res.json({
            success: true,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
            data: orders
        });
    } catch (err) {
        console.error('getAllServiceOrders error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch service orders' });
    }
};

// Get service order by ID
export const getServiceOrderById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!id) return res.status(400).json({ success: false, error: 'Invalid ID' });

        const serviceOrder = await prisma.serviceOrder.findUnique({
            where: { id },
            include: {
                guest: true,
                items: {
                    include: {
                        extraService: true
                    }
                },
                payments: true
            }
        });

        if (!serviceOrder) {
            return res.status(404).json({ success: false, error: 'Service order not found' });
        }

        res.json({ success: true, serviceOrder });
    } catch (err) {
        console.error('getServiceOrderById error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch service order' });
    }
};

// Update service order status
export const updateServiceOrder = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { status } = req.body;

        if (!['pending', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }

        const serviceOrder = await prisma.serviceOrder.update({
            where: { id },
            data: { status, updatedAt: new Date() },
            include: {
                guest: true,
                items: {
                    include: {
                        extraService: true
                    }
                },
                payments: true
            }
        });

        try {
            const io = getIO();
            io && io.emit('fo:service-order:updated', { serviceOrder });
        } catch { }

        res.json({ success: true, serviceOrder });
    } catch (err) {
        console.error('updateServiceOrder error:', err);
        res.status(500).json({ success: false, error: 'Failed to update service order' });
    }
};

// Add items to existing service order
export const addItemsToServiceOrder = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { items } = req.body; // Array of { extraServiceId, quantity }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, error: 'No items provided' });
        }

        // Get current order
        const currentOrder = await prisma.serviceOrder.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!currentOrder) {
            return res.status(404).json({ success: false, error: 'Service order not found' });
        }

        if (currentOrder.status !== 'pending') {
            return res.status(400).json({ success: false, error: 'Can only add items to pending orders' });
        }

        // Calculate totals for new items
        let additionalTotal = 0;
        const newOrderItems = [];

        for (const item of items) {
            const extraService = await prisma.extraService.findUnique({
                where: { id: Number(item.extraServiceId) }
            });

            if (!extraService) {
                return res.status(400).json({ success: false, error: `Service not found: ${item.extraServiceId}` });
            }

            const quantity = Number(item.quantity) || 1;
            const unitPrice = extraService.price;
            const itemTotal = unitPrice * quantity;

            additionalTotal += itemTotal;

            // Check if service already exists in order
            const existingItem = currentOrder.items.find(i => i.extraServiceId === extraService.id);
            if (existingItem) {
                // Update existing item quantity
                await prisma.serviceOrderItem.update({
                    where: { id: existingItem.id },
                    data: { quantity: existingItem.quantity + quantity }
                });
            } else {
                // Add new item
                newOrderItems.push({
                    serviceOrderId: id,
                    extraServiceId: extraService.id,
                    quantity,
                    unitPrice,
                    totalPrice: itemTotal
                });
            }
        }

        // Create new order items
        if (newOrderItems.length > 0) {
            await prisma.serviceOrderItem.createMany({
                data: newOrderItems
            });
        }

        // Update order total
        const updatedOrder = await prisma.serviceOrder.update({
            where: { id },
            data: {
                totalAmount: currentOrder.totalAmount + additionalTotal,
                updatedAt: new Date()
            },
            include: {
                guest: true,
                items: {
                    include: {
                        extraService: true
                    }
                },
                payments: true
            }
        });

        try {
            const io = getIO();
            io && io.emit('fo:service-order:updated', { serviceOrder: updatedOrder });
        } catch { }

        res.json({ success: true, serviceOrder: updatedOrder });
    } catch (err) {
        console.error('addItemsToServiceOrder error:', err);
        res.status(500).json({ success: false, error: 'Failed to add items to service order' });
    }
};
