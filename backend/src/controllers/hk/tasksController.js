import prisma from "../../config/client.js";
import { getIO } from "../../socket.js";

// List tasks with filters and pagination
export const listTasks = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, parseInt(req.query.limit) || 20)
    const skip = (page - 1) * limit

    const { status, assignedTo, roomId, type, priority, from, to, sortBy, sortDir } = req.query
    const where = {}
    if (status) where.status = status
    if (assignedTo) where.assignedTo = { contains: String(assignedTo), mode: 'insensitive' }
    if (roomId) where.roomId = Number(roomId)
    if (type) where.type = String(type)
    if (priority) where.priority = priority
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const orderBy = {}
    if (sortBy) {
      const key = String(sortBy)
      const direction = String(sortDir || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'
      orderBy[key] = direction
    } else {
      orderBy.createdAt = 'desc'
    }

    const [data, total] = await Promise.all([
      prisma.hkTask.findMany({
        where,
        include: { attachments: true, room: { select: { id: true, roomNumber: true, floor: true } } },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.hkTask.count({ where })
    ])

    res.json({ success: true, currentPage: page, totalPages: Math.ceil(total/limit), total, data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to list tasks' })
  }
}

// Create a new task
export const createTask = async (req, res) => {
  try {
    const body = req.body || {}
    const task = await prisma.hkTask.create({
      data: {
        roomId: Number(body.roomId),
        bookingId: body.bookingId ? Number(body.bookingId) : null,
        type: String(body.type || 'cleaning'),
        title: String(body.title),
        description: body.description || null,
        priority: body.priority || 'MEDIUM',
        status: body.status || 'NEW',
        assignedTo: body.assignedTo || null,
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
        checklist: body.checklist ? JSON.parse(body.checklist) : null,
        notes: body.notes || null,
      }
    })
    const io = getIO();
    io && io.emit('hk:task:created', { task })
    res.status(201).json({ success: true, task })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to create task' })
  }
}

// Get a single task
export const getTaskById = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const task = await prisma.hkTask.findUnique({
      where: { id },
      include: { attachments: true, room: true, booking: true }
    })
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' })
    res.json({ success: true, task })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to fetch task' })
  }
}

// Update a task (including status/assignment)
export const updateTask = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const body = req.body || {}
    const updated = await prisma.hkTask.update({
      where: { id },
      data: {
        ...(body.roomId && { roomId: Number(body.roomId) }),
        ...(body.bookingId && { bookingId: Number(body.bookingId) }),
        ...(body.type && { type: String(body.type) }),
        ...(body.title && { title: String(body.title) }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.priority && { priority: body.priority }),
        ...(body.status && { status: body.status }),
        ...(body.assignedTo !== undefined && { assignedTo: body.assignedTo }),
        ...(body.dueAt && { dueAt: new Date(body.dueAt) }),
        ...(body.checklist && { checklist: JSON.parse(body.checklist) }),
        ...(body.notes !== undefined && { notes: body.notes }),
        updatedAt: new Date()
      },
      include: { attachments: true }
    })
    const io = getIO();
    io && io.emit('hk:task:updated', { task: updated })
    res.json({ success: true, task: updated })
  } catch (err) {
    console.error(err)
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: 'Task not found' })
    res.status(500).json({ success: false, error: 'Failed to update task' })
  }
}

// Delete a task
export const deleteTask = async (req, res) => {
  try {
    const id = Number(req.params.id)
    // delete attachments first
    await prisma.hkTaskAttachment.deleteMany({ where: { taskId: id } })
    await prisma.hkTask.delete({ where: { id } })
    const io = getIO();
    io && io.emit('hk:task:deleted', { id })
    res.json({ success: true, message: 'Task deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to delete task' })
  }
}

// Add attachments to a task (expects multer middleware)
export const addTaskAttachments = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const files = req.files || []
    if (!files.length) return res.status(400).json({ success: false, error: 'No files uploaded' })

    const toCreate = files.map(f => ({
      taskId: id,
      fileUrl: f.path ?? f.filename ?? '',
      fileType: f.mimetype || 'other'
    }))

    const created = await prisma.hkTaskAttachment.createMany({ data: toCreate })
    const task = await prisma.hkTask.findUnique({ where: { id }, include: { attachments: true } })
    const io = getIO();
    io && io.emit('hk:task:attachments', { id, count: created.count })
    res.json({ success: true, count: created.count, task })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to add attachments' })
  }
}
