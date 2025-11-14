import prisma from "../../config/client.js";
import { getIO } from "../../socket.js";

// Helper function to create notification
const createNotification = async (type, message, sender = null, meta = null) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        type,
        message,
        sender,
        meta
      }
    });

    // Emit notification event via Socket.IO
    const io = getIO();
    io && io.emit('notification:new', { notification });

    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
};

// GET /api/hk/tasks
export const listTasks = async (req, res) => {
  try {
    const {
      status,
      assignedTo,
      roomId,
      bookingId,
      type,
      q,
      limit = 100,
      offset = 0,
      sortBy = 'createdAt',
      sortDir = 'desc'
    } = req.query || {};

    const where = {};
    if (status) where.status = String(status);
    if (assignedTo !== undefined) where.assignedTo = assignedTo === '' ? null : String(assignedTo);
    if (roomId) where.roomId = Number(roomId);
    if (bookingId) where.bookingId = Number(bookingId);
    if (type) where.type = String(type);
    if (q) {
      where.OR = [
        { title: { contains: String(q), mode: 'insensitive' } },
        { description: { contains: String(q), mode: 'insensitive' } }
      ];
    }

    const take = Math.min(Number(limit) || 100, 500);
    const skip = Math.max(Number(offset) || 0, 0);

    const tasks = await prisma.hkTask.findMany({
      where,
      include: { room: { select: { id: true, roomNumber: true, status: true } } },
      orderBy: { [String(sortBy)]: String(sortDir).toLowerCase() === 'asc' ? 'asc' : 'desc' },
      take,
      skip,
    });

    res.json({ success: true, data: tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to list tasks' });
  }
};

// POST /api/hk/tasks
export const createTask = async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.roomId || !body.title || !body.type) {
      return res.status(400).json({ success: false, error: 'roomId, title and type are required' });
    }
    // Validate room exists before creating task to avoid FK error
    const roomIdNum = Number(body.roomId)
    if (!Number.isFinite(roomIdNum)) {
      return res.status(400).json({ success: false, error: 'roomId must be a number' });
    }
    const room = await prisma.room.findUnique({ where: { id: roomIdNum }, select: { id: true, roomNumber: true } })
    if (!room) {
      return res.status(400).json({ success: false, error: 'Invalid roomId: room does not exist' })
    }
    const task = await prisma.hkTask.create({
      data: {
        roomId: roomIdNum,
        bookingId: body.bookingId ? Number(body.bookingId) : null,
        type: String(body.type),
        title: String(body.title),
        description: body.description ? String(body.description) : null,
        priority: body.priority || 'MEDIUM',
        status: body.status || 'NEW',
        assignedTo: body.assignedTo ? String(body.assignedTo) : null,
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
        checklist: body.checklist ?? null,
        notes: body.notes ? String(body.notes) : null,
        updatedAt: new Date(),
      },
      include: { room: { select: { id: true, roomNumber: true, status: true } } }
    });
    const io = getIO();
    io && io.emit('hk:task:created', { task });

    // Create notification for new housekeeping task
    await createNotification(
      'housekeeping',
      `New ${task.type} task created for room ${task.room.roomNumber}: ${task.title}`,
      'system',
      { taskId: task.id, roomId: task.roomId, type: 'new_task' }
    );

    // If this is a cleaning task, ensure the room appears in the cleaning schedule
    // by marking it as 'needs-cleaning' and notifying listeners.
    if (task.type === 'cleaning') {
      const room = await prisma.room.update({
        where: { id: roomIdNum },
        data: { status: 'needs-cleaning', updatedAt: new Date() },
        select: { id: true, roomNumber: true, floor: true, status: true }
      })
      io && io.emit('hk:room:status', { room })
    }
    res.status(201).json({ success: true, task });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2003') {
      return res.status(400).json({ success: false, error: 'Invalid foreign key. Please verify roomId and bookingId.' })
    }
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
};

// PUT /api/hk/tasks/:id
export const updateTask = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};
    const data = {
      ...(body.roomId !== undefined && { roomId: Number(body.roomId) }),
      ...(body.bookingId !== undefined && { bookingId: body.bookingId ? Number(body.bookingId) : null }),
      ...(body.type !== undefined && { type: String(body.type) }),
      ...(body.title !== undefined && { title: String(body.title) }),
      ...(body.description !== undefined && { description: body.description ? String(body.description) : null }),
      ...(body.priority !== undefined && { priority: String(body.priority) }),
      ...(body.status !== undefined && { status: String(body.status) }),
      ...(body.assignedTo !== undefined && { assignedTo: body.assignedTo ? String(body.assignedTo) : null }),
      ...(body.dueAt !== undefined && { dueAt: body.dueAt ? new Date(body.dueAt) : null }),
      ...(body.checklist !== undefined && { checklist: body.checklist }),
      ...(body.notes !== undefined && { notes: body.notes ? String(body.notes) : null }),
      updatedAt: new Date(),
    };

    const task = await prisma.hkTask.update({
      where: { id },
      data,
      include: { room: { select: { id: true, roomNumber: true, status: true } } }
    });
    const io = getIO();
    io && io.emit('hk:task:updated', { task });

    // Create notification for task status change
    if (body.status && body.status !== task.status) {
      await createNotification(
        'housekeeping',
        `Task status changed to ${body.status} for room ${task.room.roomNumber}: ${task.title}`,
        'system',
        { taskId: task.id, roomId: task.roomId, type: 'status_change', oldStatus: task.status, newStatus: body.status }
      );
    }
    res.json({ success: true, task });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.status(500).json({ success: false, error: 'Failed to update task' });
  }
};

// DELETE /api/hk/tasks/:id
export const deleteTask = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.hkTask.delete({ where: { id } });
    const io = getIO();
    io && io.emit('hk:task:deleted', { id });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.status(500).json({ success: false, error: 'Failed to delete task' });
  }
};

// POST /api/hk/tasks/:id/attachments (optional)
export const addAttachment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const file = req.file; // using upload.single('file') in route
    if (!file) return res.status(400).json({ success: false, error: 'No file provided' });
    const att = await prisma.hkTaskAttachment.create({
      data: {
        taskId: id,
        fileUrl: file.path,
        fileType: file.mimetype,
      }
    });
    const io = getIO();
    io && io.emit('hk:task:attachments', { taskId: id, attachment: att });
    res.status(201).json({ success: true, attachment: att });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to add attachment' });
  }
};
