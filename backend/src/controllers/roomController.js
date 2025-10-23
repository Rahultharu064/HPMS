import prisma from "../config/client.js";
import fs from "fs";
import path from "path";
import { getIO } from "../socket.js";

const removeFileIfExists = (filePath) => {
  try {
    const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch (err) {
    console.error("Failed to remove file:", filePath, err.message);
  }
};

// GET /api/rooms/status-map → simplified list for housekeeping UI
export const getRoomsStatusMap = async (req, res) => {
  try {
    const { floor, status } = req.query;
    const where = {};
    if (floor) where.floor = Number(floor);
    if (status && status !== 'all') where.status = String(status);

    const rooms = await prisma.room.findMany({
      where,
      select: {
        id: true,
        roomNumber: true,
        floor: true,
        status: true,
        updatedAt: true,
      },
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }]
    });

    res.json({ success: true, data: rooms });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch room status map' });
  }
};

// PUT /api/rooms/:id/status → update a room's housekeeping status
export const updateRoomStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    const allowed = [
      'clean',
      'needs-cleaning',
      'occupied',
      'maintenance',
      'available'
    ];
    if (!allowed.includes(String(status))) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const updated = await prisma.room.update({
      where: { id },
      data: { status: String(status), updatedAt: new Date() },
      select: { id: true, roomNumber: true, floor: true, status: true, updatedAt: true }
    });
    const io = getIO();
    io && io.emit('hk:room:status', { room: updated })
    res.json({ success: true, room: updated });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    res.status(500).json({ success: false, error: 'Failed to update room status' });
  }
};

// List reviews for a room with summary
export const getRoomReviews = async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    if (!Number.isFinite(roomId) || roomId <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid room id' });
    }
    const [reviews, aggregate] = await Promise.all([
      prisma.review.findMany({
        where: { roomId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, roomId: true, name: true, rating: true, comment: true, createdAt: true }
      }),
      prisma.review.aggregate({
        _avg: { rating: true },
        _count: { _all: true },
        where: { roomId }
      })
    ]);
    const ratingAvg = Number(aggregate._avg.rating ?? 0);
    const ratingCount = Number(aggregate._count._all ?? 0);
    res.json({ success: true, data: reviews, ratingAvg, ratingCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
  }
};

// Create a review for a room
export const addRoomReview = async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    if (!Number.isFinite(roomId) || roomId <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid room id' });
    }
    const body = req.validatedBody ?? req.body;
    const name = String(body.name);
    const rating = Number(body.rating);
    const comment = String(body.comment);
    const created = await prisma.review.create({
      data: { roomId, name, rating, comment },
      select: { id: true, roomId: true, name: true, rating: true, comment: true, createdAt: true }
    });
    res.status(201).json({ success: true, review: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to add review' });
  }
};

// Create room
export const createRoom = async (req, res) => {
  try {
    // validated body if validate middleware used
    const body = req.validatedBody ?? req.body;

    // amenities: can be string JSON or single string or array
    let amenitiesArray = [];
    if (body.amenities) {
      if (Array.isArray(body.amenities)) amenitiesArray = body.amenities;
      else {
        try { amenitiesArray = JSON.parse(body.amenities); }
        catch { amenitiesArray = [body.amenities]; }
      }
    }

    // files handling -> store metadata as per Prisma schema (name/size/type)
    const images = (req.files?.images || []).map(f => ({
      name: f.originalname,
      size: f.size,
      type: f.mimetype,
      url: path.relative(process.cwd(), f.path ?? path.join(f.destination, f.filename))
    }));
    const videos = (req.files?.videos || []).map(f => ({
      name: f.originalname,
      size: f.size,
      type: f.mimetype,
      url: path.relative(process.cwd(), f.path ?? path.join(f.destination, f.filename))
    }));

    const newRoom = await prisma.room.create({
      data: {
        name: body.name,
        roomType: body.roomType,
        roomNumber: body.roomNumber,
        floor: Number(body.floor),
        price: Number(body.price),
        size: Number(body.size),
        maxAdults: Number(body.maxAdults),
        maxChildren: body.maxChildren ? Number(body.maxChildren) : 0,
        numBeds: Number(body.numBeds),
        allowChildren: body.allowChildren === "true" || body.allowChildren === true,
        description: body.description,
        status: body.status ?? "available",
        updatedAt: new Date(),
        amenity: { create: amenitiesArray.map(a => ({ name: a })) },
        image: { create: images },
        video: { create: videos }
      },
      include: { amenity: true, image: true, video: true }
    });

    res.status(201).json({ success: true, room: newRoom });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002' && err.meta?.target?.includes('roomNumber')) {
      return res.status(409).json({ success: false, error: 'Room number already exists. Please use a different room number.' });
    }
    res.status(500).json({ success: false, error: "Failed to create room" });
  }
};

// Get all rooms with search/filter/pagination
export const getAllRooms = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;
    const { search, minPrice, maxPrice, roomType, status } = req.query;
    const adults = req.query.adults ? parseInt(req.query.adults) : undefined;
    const children = req.query.children ? parseInt(req.query.children) : undefined;
    const sort = req.query.sort || "created_desc";
    // amenities can be a comma-separated string or array
    let amenities = [];
    if (req.query.amenities) {
      if (Array.isArray(req.query.amenities)) amenities = req.query.amenities;
      else amenities = String(req.query.amenities).split(",").map(s => s.trim()).filter(Boolean);
    }

    // build where clause
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { roomType: { contains: search, mode: "insensitive" } },
        { roomNumber: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }

    if (roomType) where.roomType = { equals: roomType };
    if (status) where.status = { equals: status };
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // adults/children filters (capacity)
    if (Number.isFinite(adults) && adults > 0) {
      where.maxAdults = { gte: adults };
    }
    if (Number.isFinite(children) && children >= 0) {
      // if schema has maxChildren; default rooms without children allowed may still have 0
      where.maxChildren = { gte: children };
    }

    // amenities filter: require all provided amenities
    if (amenities.length > 0) {
      where.AND = (where.AND || []).concat(
        amenities.map(name => ({ amenity: { some: { name: { equals: name } } } }))
      );
    }

    // Sorting
    let orderBy;
    switch (sort) {
      case "price_asc":
        orderBy = { price: "asc" };
        break;
      case "price_desc":
        orderBy = { price: "desc" };
        break;
      case "name_asc":
        orderBy = { name: "asc" };
        break;
      case "created_asc":
        orderBy = { createdAt: "asc" };
        break;
      case "created_desc":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        include: { amenity: true, image: true, video: true },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.room.count({ where })
    ]);

    // Enrich with review aggregates
    const roomIds = rooms.map(r => r.id)
    let ratingByRoom = new Map();
    if (roomIds.length > 0) {
      const aggregates = await prisma.review.groupBy({
        by: ['roomId'],
        where: { roomId: { in: roomIds } },
        _avg: { rating: true },
        _count: { _all: true }
      });
      for (const a of aggregates) {
        ratingByRoom.set(a.roomId, {
          ratingAvg: Number(a._avg.rating ?? 0),
          ratingCount: Number(a._count._all ?? 0)
        });
      }
    }
    const enriched = rooms.map(r => ({
      ...r,
      ratingAvg: ratingByRoom.get(r.id)?.ratingAvg ?? 0,
      ratingCount: ratingByRoom.get(r.id)?.ratingCount ?? 0
    }))

    res.json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      data: enriched
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch rooms" });
  }
};

// Get single room
export const getRoomById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const room = await prisma.room.findUnique({
      where: { id },
      include: { amenity: true, image: true, video: true }
    });
    if (!room) return res.status(404).json({ success: false, error: "Room not found" });
    const ratingCount = 0;
    const ratingAvg = 0;
    res.json({ success: true, room: { ...room, ratingAvg, ratingCount } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch room" });
  }
};
// GET /api/rooms/featured → Featured rooms (top 6 rooms by price)
export const getFeaturedRooms = async (req, res) => {
  try {
    const featuredRooms = await prisma.room.findMany({
      where: { status: "available" },
      include: { 
        amenity: true, 
        image: true, 
        video: true
      },
      orderBy: { price: "desc" },
      take: 6
    });

    const roomIds = featuredRooms.map(r => r.id);
    let ratingByRoom = new Map();
    if (roomIds.length > 0) {
      const aggregates = await prisma.review.groupBy({
        by: ['roomId'],
        where: { roomId: { in: roomIds } },
        _avg: { rating: true },
        _count: { _all: true }
      });
      for (const a of aggregates) {
        ratingByRoom.set(a.roomId, {
          ratingAvg: Number(a._avg.rating ?? 0),
          ratingCount: Number(a._count._all ?? 0)
        });
      }
    }

    const enriched = featuredRooms.map(r => ({
      ...r,
      ratingAvg: ratingByRoom.get(r.id)?.ratingAvg ?? 0,
      ratingCount: ratingByRoom.get(r.id)?.ratingCount ?? 0
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch featured rooms', details: err.message });
  }
};

// GET /api/rooms/:id/similar → Similar rooms (same type, different room)
export const getSimilarRooms = async (req, res) => {
  try {
    const id = Number(req.params.id);
    
    // First get the current room to find its type
    const currentRoom = await prisma.room.findUnique({
      where: { id },
      select: { roomType: true }
    });
    
    if (!currentRoom) {
      return res.status(404).json({ success: false, error: "Room not found" });
    }
    
    // Find similar rooms (same type, different room, available)
    const similarRooms = await prisma.room.findMany({
      where: { 
        roomType: currentRoom.roomType,
        id: { not: id },
        status: "available"
      },
      include: { 
        amenity: true, 
        image: true, 
        video: true
      },
      orderBy: { price: "asc" },
      take: 4
    });
    const enriched = similarRooms.map(r => ({ ...r, ratingAvg: 0, ratingCount: 0 }));
    
    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch similar rooms" });
  }
};



// Update room (replace amenities/images/videos if provided)
export const updateRoom = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.room.findUnique({
      where: { id },
      include: { amenity: true, image: true, video: true }
    });
    if (!existing) return res.status(404).json({ success: false, error: "Room not found" });

    const body = req.validatedBody ?? req.body;

    // normalize amenities
    let amenitiesArray = [];
    if (body.amenities) {
      if (Array.isArray(body.amenities)) amenitiesArray = body.amenities;
      else {
        try { amenitiesArray = JSON.parse(body.amenities); } catch { amenitiesArray = [body.amenities]; }
      }
    }

    // new uploads -> store metadata (name/size/type)
    const imagesNew = (req.files?.images || []).map(f => ({
      name: f.originalname,
      size: f.size,
      type: f.mimetype,
      url: path.relative(process.cwd(), f.path ?? path.join(f.destination, f.filename))
    }));
    const videosNew = (req.files?.videos || []).map(f => ({
      name: f.originalname,
      size: f.size,
      type: f.mimetype,
      url: path.relative(process.cwd(), f.path ?? path.join(f.destination, f.filename))
    }));

    // If new images/videos uploaded -> delete old files + DB rows
    if (imagesNew.length > 0) {
      for (const img of existing.image) {
        if (img.url) removeFileIfExists(path.join(process.cwd(), img.url));
      }
      await prisma.image.deleteMany({ where: { roomId: id } });
    }

    if (videosNew.length > 0) {
      for (const vid of existing.video) {
        if (vid.url) removeFileIfExists(path.join(process.cwd(), vid.url));
      }
      await prisma.video.deleteMany({ where: { roomId: id } });
    }

    // Always delete and recreate amenities if provided
    if (amenitiesArray.length > 0) {
      await prisma.amenity.deleteMany({ where: { roomId: id } });
    }

    const updatedData = {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.roomType !== undefined && { roomType: body.roomType }),
      ...(body.roomNumber !== undefined && { roomNumber: body.roomNumber }),
      ...(body.floor !== undefined && { floor: Number(body.floor) }),
      ...(body.price !== undefined && { price: Number(body.price) }),
      ...(body.size !== undefined && { size: Number(body.size) }),
      ...(body.maxAdults !== undefined && { maxAdults: Number(body.maxAdults) }),
      ...(body.maxChildren !== undefined && { maxChildren: Number(body.maxChildren) }),
      ...(body.numBeds !== undefined && { numBeds: Number(body.numBeds) }),
      ...(body.allowChildren !== undefined && { allowChildren: body.allowChildren === "true" || body.allowChildren === true }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.status !== undefined && { status: body.status }),
      updatedAt: new Date(),
    };

    // nested creates for new relations
    if (amenitiesArray.length > 0) {
      updatedData.amenity = { create: amenitiesArray.map(a => ({ name: a })) };
    }
    if (imagesNew.length > 0) updatedData.image = { create: imagesNew };
    if (videosNew.length > 0) updatedData.video = { create: videosNew };

    const updated = await prisma.room.update({
      where: { id },
      data: updatedData,
      include: { amenity: true, image: true, video: true }
    });

    res.json({ success: true, room: updated });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002' && err.meta?.target?.includes('roomNumber')) {
      return res.status(409).json({ success: false, error: 'Room number already exists. Please use a different room number.' });
    }
    res.status(500).json({ success: false, error: "Failed to update room" });
  }
};

// Delete room + files + related rows
export const deleteRoom = async (req, res) => {
  try {
    const id = Number(req.params.id);
    console.log(`Attempting to delete room with ID: ${id}`);
    
    const existing = await prisma.room.findUnique({
      where: { id },
      include: { image: true, video: true, amenity: true }
    });
    
    if (!existing) {
      console.log(`Room with ID ${id} not found`);
      return res.status(404).json({ success: false, error: "Room not found" });
    }

    console.log(`Found room: ${existing.name} with ${existing.image.length} images, ${existing.video.length} videos, ${existing.amenity.length} amenities`);

    // Remove files from filesystem
    for (const img of existing.image) {
      if (img.url) {
        console.log(`Removing image file: ${img.url}`);
        removeFileIfExists(path.join(process.cwd(), img.url));
      }
    }
    
    for (const vid of existing.video) {
      if (vid.url) {
        console.log(`Removing video file: ${vid.url}`);
        removeFileIfExists(path.join(process.cwd(), vid.url));
      }
    }

    // Delete related records first (due to foreign key constraints)
    console.log('Deleting related records...');
    
    // Delete amenities
    await prisma.amenity.deleteMany({ where: { roomId: id } });
    console.log('Deleted amenities');
    
    // Delete images
    await prisma.image.deleteMany({ where: { roomId: id } });
    console.log('Deleted images');
    
    // Delete videos
    await prisma.video.deleteMany({ where: { roomId: id } });
    console.log('Deleted videos');

    // Finally delete the room
    await prisma.room.delete({ where: { id } });
    console.log('Deleted room successfully');

    res.json({ success: true, message: "Room deleted successfully" });
  } catch (err) {
    console.error("Error deleting room:", err);
    console.error("Error details:", {
      message: err.message,
      code: err.code,
      meta: err.meta
    });
    res.status(500).json({ 
      success: false, 
      error: "Failed to delete room",
      details: err.message 
    });
  }
};
