import prisma from "../config/client.js";

// Temporary mock data until DB migration is applied
const mockFacilities = [
  {
    id: 1,
    name: "Spa & Wellness",
    slug: "spa-wellness",
    description: "Relaxing spa treatments and sauna.",
    status: "open",
    openingHours: "Mon-Sun 08:00-20:00",
    category: "Wellness",
    images: [
      { url: "https://images.unsplash.com/photo-1556228453-efd1a8e3b6c5?w=1200" }
    ],
    videos: []
  },
  {
    id: 2,
    name: "Fitness Center",
    slug: "fitness-center",
    description: "State-of-the-art gym equipment.",
    status: "open",
    openingHours: "Mon-Sun 06:00-22:00",
    category: "Fitness",
    images: [
      { url: "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?w=1200" }
    ],
    videos: []
  },
  {
    id: 3,
    name: "Infinity Pool",
    slug: "infinity-pool",
    description: "Heated outdoor pool with city view.",
    status: "closed",
    openingHours: "Seasonal",
    category: "Recreation",
    images: [
      { url: "https://images.unsplash.com/photo-1501117716987-c8e2a9cebf1b?w=1200" }
    ],
    videos: []
  }
];

export const getFacilities = async (req, res) => {
  const { category, status, search } = req.query;

  // Try DB first, fallback to mock
  try {
    const where = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (search) where.name = { contains: String(search), mode: "insensitive" };

    const facilities = await prisma.facility.findMany({
      where,
      include: {
        images: true,
        videos: true
      },
      orderBy: { createdAt: "desc" }
    });

    return res.json({ data: facilities });
  } catch (e) {
    const filtered = mockFacilities.filter((f) => {
      if (category && f.category !== category) return false;
      if (status && f.status !== status) return false;
      if (search && !f.name.toLowerCase().includes(String(search).toLowerCase())) return false;
      return true;
    });
    return res.json({ data: filtered, note: "mock" });
  }
};

export const getFacilityById = async (req, res) => {
  const { id } = req.params;
  const numericId = Number(id);

  try {
    const facility = await prisma.facility.findUnique({
      where: isNaN(numericId) ? { slug: id } : { id: numericId },
      include: { images: true, videos: true }
    });
    if (!facility) return res.status(404).json({ message: "Facility not found" });
    return res.json({ data: facility });
  } catch (e) {
    const facility = mockFacilities.find((f) => f.id === numericId || f.slug === id);
    if (!facility) return res.status(404).json({ message: "Facility not found (mock)" });
    return res.json({ data: facility, note: "mock" });
  }
};

export const createFacility = async (req, res) => {
  try {
    const { name, slug, description, status = "open", openingHours, category } = req.body || {}

    if (!name || !description) {
      return res.status(400).json({ message: "name and description are required" })
    }

    const toSlug = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const finalSlug = slug && slug.length > 0 ? toSlug(slug) : toSlug(name)

    const created = await prisma.$transaction(async (tx) => {
      const facility = await tx.facility.create({
        data: { name, slug: finalSlug, description, status, openingHours, category }
      })
      // Handle multipart uploads if present
      const uploadedImages = req.files?.images || []

      if (uploadedImages.length) {
        await tx.facilityImage.createMany({
          data: uploadedImages.map((f, idx) => ({
            facilityId: facility.id,
            url: f.path.replace(/\\/g, '/'),
            name: f.originalname || `image-${idx + 1}`,
            size: f.size || 0,
            type: f.mimetype || 'image/jpeg',
            order: idx
          }))
        })
      } else if (Array.isArray(req.body?.images) && req.body.images.length) {
        const images = Array.isArray(req.body.images) ? req.body.images : []
        await tx.facilityImage.createMany({
          data: images.map((img, idx) => ({ facilityId: facility.id, url: String(img.url || img), name: img.name || `image-${idx+1}`, size: img.size || 0, type: img.type || 'image/jpeg', order: idx }))
        })
      }

      // videos are not supported for facilities as per requirements
      return tx.facility.findUnique({ where: { id: facility.id }, include: { images: true, videos: true } })
    })

    return res.status(201).json({ data: created })
  } catch (e) {
    return res.status(500).json({ message: "Failed to create facility", error: e?.message })
  }
};

export const updateFacility = async (req, res) => {
  try {
    const { id } = req.params
    const numericId = Number(id)
    const { name, slug, description, status, openingHours, category } = req.body || {}

    const toSlug = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const updates = {}
    if (name !== undefined) updates.name = name
    if (slug !== undefined) updates.slug = toSlug(slug)
    if (description !== undefined) updates.description = description
    if (status !== undefined) updates.status = status
    if (openingHours !== undefined) updates.openingHours = openingHours
    if (category !== undefined) updates.category = category

    const updated = await prisma.$transaction(async (tx) => {
      const f = await tx.facility.update({
        where: isNaN(numericId) ? { slug: id } : { id: numericId },
        data: updates
      })

      // Replace media if new uploads provided
      const uploadedImages = req.files?.images || []
      const uploadedVideos = req.files?.videos || []
      if (uploadedImages.length) {
        await tx.facilityImage.deleteMany({ where: { facilityId: f.id } })
        await tx.facilityImage.createMany({
          data: uploadedImages.map((file, idx) => ({
            facilityId: f.id,
            url: file.path.replace(/\\/g, '/'),
            name: file.originalname || `image-${idx + 1}`,
            size: file.size || 0,
            type: file.mimetype || 'image/jpeg',
            order: idx
          }))
        })
      }
      // videos are not supported for facilities as per requirements
      
      return tx.facility.findUnique({ where: { id: f.id }, include: { images: true, videos: true } })
    })

    return res.json({ data: updated })
  } catch (e) {
    return res.status(500).json({ message: "Failed to update facility", error: e?.message })
  }
};

export const deleteFacility = async (req, res) => {
  try {
    const { id } = req.params
    const numericId = Number(id)
    const where = isNaN(numericId) ? { slug: id } : { id: numericId }
    await prisma.$transaction(async (tx) => {
      const f = await tx.facility.findUnique({ where })
      if (!f) throw new Error('Facility not found')
      await tx.facilityImage.deleteMany({ where: { facilityId: f.id } })
      await tx.facilityVideo.deleteMany({ where: { facilityId: f.id } })
      await tx.facility.delete({ where: { id: f.id } })
    })
    return res.json({ message: 'Facility deleted' })
  } catch (e) {
    return res.status(500).json({ message: "Failed to delete facility", error: e?.message })
  }
};
