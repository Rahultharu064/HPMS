import prisma from "../../config/client.js";
import path from "path";

export const listHousekeepers = async (req, res) => {
  try {
    const { q } = req.query || {}
    const where = q ? { name: { contains: String(q), mode: 'insensitive' } } : {}
    const data = await prisma.housekeeper.findMany({ where, orderBy: { name: 'asc' } })
    res.json({ success: true, data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to list housekeepers' })
  }
}

export const getHousekeeper = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const hk = await prisma.housekeeper.findUnique({ where: { id } })
    if (!hk) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: hk })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to fetch housekeeper' })
  }
}

export const createHousekeeper = async (req, res) => {
  try {
    const body = req.body || {}
    if (!body.name) return res.status(400).json({ success: false, error: 'name required' })
    const hk = await prisma.housekeeper.create({
      data: {
        name: String(body.name),
        shift: body.shift ? String(body.shift) : 'MORNING',
        contact: body.contact ? String(body.contact) : null,
        profilePictureUrl: null,
        updatedAt: new Date(),
      }
    })
    res.status(201).json({ success: true, data: hk })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to create housekeeper' })
  }
}

export const updateHousekeeper = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const body = req.body || {}
    const data = {
      ...(body.name !== undefined && { name: String(body.name) }),
      ...(body.shift !== undefined && { shift: body.shift ? String(body.shift) : 'MORNING' }),
      ...(body.contact !== undefined && { contact: body.contact ? String(body.contact) : null }),
      updatedAt: new Date(),
    }
    const hk = await prisma.housekeeper.update({ where: { id }, data })
    res.json({ success: true, data: hk })
  } catch (err) {
    console.error(err)
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: 'Not found' })
    res.status(500).json({ success: false, error: 'Failed to update housekeeper' })
  }
}

export const uploadHousekeeperPhoto = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const file = req.file;
    console.log('Received file for upload:', file);

    if (!file) {
      console.error('No file received for upload.');
      return res.status(400).json({ success: false, error: 'File required for upload.' });
    }

    // Multer provides file.path when diskStorage is used
    const relativeFilePath = path.relative(process.cwd(), file.path);
    console.log('Constructed relative file path:', relativeFilePath);

    const hk = await prisma.housekeeper.update({
      where: { id },
      data: { profilePictureUrl: relativeFilePath, updatedAt: new Date() },
    });

    res.json({ success: true, data: { profilePictureUrl: hk.profilePictureUrl } });
  } catch (err) {
    console.error('Error in uploadHousekeeperPhoto:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Housekeeper not found.' });
    }
    res.status(500).json({ success: false, error: `Failed to upload photo: ${err.message}` });
  }
};

export const deleteHousekeeperPhoto = async (req, res) => {
  try {
    const id = Number(req.params.id)
    await prisma.housekeeper.update({ where: { id }, data: { profilePictureUrl: null, updatedAt: new Date() } })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: 'Not found' })
    res.status(500).json({ success: false, error: 'Failed to delete photo' })
  }
}

export const deleteHousekeeper = async (req, res) => {
  try {
    const id = Number(req.params.id)
    await prisma.housekeeper.delete({ where: { id } })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: 'Not found' })
    res.status(500).json({ success: false, error: 'Failed to delete housekeeper' })
  }
}
