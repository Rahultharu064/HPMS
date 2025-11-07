import prisma from "../config/client.js";

// Get all room types
export const getAllRoomTypes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;
    const { search } = req.query;

    const where = {};
    if (search) {
      where.name = { contains: search };
    }

    const [roomTypes, total] = await Promise.all([
      prisma.roomType.findMany({
        where,
        include: {
          rooms: {
            select: {
              id: true,
              roomNumber: true,
              status: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.roomType.count({ where })
    ]);

    // Enrich with room counts
    const enriched = roomTypes.map(rt => ({
      ...rt,
      totalRooms: rt.rooms.length,
      availableRooms: rt.rooms.filter(r => r.status === 'available').length,
      occupiedRooms: rt.rooms.filter(r => r.status === 'occupied').length,
      maintenanceRooms: rt.rooms.filter(r => r.status === 'maintenance').length
    }));

    res.json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      data: enriched
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch room types" });
  }
};

// Get single room type
export const getRoomTypeById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const roomType = await prisma.roomType.findUnique({
      where: { id },
      include: {
        rooms: {
          select: {
            id: true,
            roomNumber: true,
            floor: true,
            status: true,
            price: true
          }
        }
      }
    });

    if (!roomType) {
      return res.status(404).json({ success: false, error: "Room type not found" });
    }

    // Enrich with room counts
    const enriched = {
      ...roomType,
      totalRooms: roomType.rooms.length,
      availableRooms: roomType.rooms.filter(r => r.status === 'available').length,
      occupiedRooms: roomType.rooms.filter(r => r.status === 'occupied').length,
      maintenanceRooms: roomType.rooms.filter(r => r.status === 'maintenance').length
    };

    res.json({ success: true, roomType: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch room type" });
  }
};

// Create room type
export const createRoomType = async (req, res) => {
  try {
    const body = req.validatedBody ?? req.body;

    const newRoomType = await prisma.roomType.create({
      data: {
        name: body.name
      }
    });

    res.status(201).json({ success: true, roomType: newRoomType });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002' && err.meta?.target?.includes('name')) {
      return res.status(409).json({ success: false, error: 'Room type name already exists. Please use a different name.' });
    }
    res.status(500).json({ success: false, error: "Failed to create room type" });
  }
};

// Update room type
export const updateRoomType = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.roomType.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: "Room type not found" });
    }

    const body = req.validatedBody ?? req.body;

    const updatedData = {
      ...(body.name !== undefined && { name: body.name })
    };

    const updated = await prisma.roomType.update({
      where: { id },
      data: updatedData
    });

    res.json({ success: true, roomType: updated });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002' && err.meta?.target?.includes('name')) {
      return res.status(409).json({ success: false, error: 'Room type name already exists. Please use a different name.' });
    }
    res.status(500).json({ success: false, error: "Failed to update room type" });
  }
};

// Delete room type
export const deleteRoomType = async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Check if room type has associated rooms
    const roomCount = await prisma.room.count({
      where: { roomTypeId: id }
    });

    if (roomCount > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete room type. It has ${roomCount} associated room(s). Please reassign or delete the rooms first.`
      });
    }

    await prisma.roomType.delete({ where: { id } });
    res.json({ success: true, message: "Room type deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to delete room type" });
  }
};
