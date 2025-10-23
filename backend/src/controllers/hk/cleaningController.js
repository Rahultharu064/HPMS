import prisma from "../../config/client.js";
import { getIO } from "../../socket.js";

export const listCleaningLogs = async (req, res) => {
  try {
    const { roomId, from, to } = req.query
    const where = {}
    if (roomId) where.roomId = Number(roomId)
    if (from || to) {
      where.startedAt = {}
      if (from) where.startedAt.gte = new Date(from)
      if (to) where.startedAt.lte = new Date(to)
    }
    const logs = await prisma.cleaningLog.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      include: { room: { select: { id: true, roomNumber: true, floor: true } } }
    })
    res.json({ success: true, data: logs })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to fetch cleaning logs' })
  }
}

export const createCleaningLog = async (req, res) => {
  try {
    const body = req.body || {}
    const log = await prisma.cleaningLog.create({
      data: {
        roomId: Number(body.roomId),
        taskId: body.taskId ? Number(body.taskId) : null,
        startedAt: new Date(body.startedAt || Date.now()),
        finishedAt: body.finishedAt ? new Date(body.finishedAt) : null,
        durationMin: body.durationMin ? Number(body.durationMin) : null,
        byUser: body.byUser || null,
        outcome: body.outcome || null,
        notes: body.notes || null,
      }
    })
    const io = getIO();
    io && io.emit('hk:cleaning:created', { log })
    res.status(201).json({ success: true, log })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to create cleaning log' })
  }
}

// Start a cleaning session for a room (and optionally a task)
export const startCleaning = async (req, res) => {
  try {
    const { roomId, taskId, byUser } = req.body || {}
    if (!roomId) return res.status(400).json({ success: false, error: 'roomId required' })
    const log = await prisma.cleaningLog.create({
      data: {
        roomId: Number(roomId),
        taskId: taskId ? Number(taskId) : null,
        startedAt: new Date(),
        byUser: byUser || null,
      }
    })
    if (taskId) {
      await prisma.hkTask.update({ where: { id: Number(taskId) }, data: { status: 'IN_PROGRESS', updatedAt: new Date() } })
    }
    const io = getIO();
    io && io.emit('hk:cleaning:start', { log })
    res.json({ success: true, log })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to start cleaning' })
  }
}

// Finish a cleaning session, mark room clean and optionally close task
export const finishCleaning = async (req, res) => {
  try {
    const { logId, roomId, taskId, outcome, byUser } = req.body || {}
    const now = new Date()
    let log
    if (logId) {
      // finish existing log
      const existing = await prisma.cleaningLog.findUnique({ where: { id: Number(logId) } })
      if (!existing) return res.status(404).json({ success: false, error: 'Cleaning log not found' })
      const durationMin = Math.max(1, Math.round((now - new Date(existing.startedAt)) / 60000))
      log = await prisma.cleaningLog.update({
        where: { id: Number(logId) },
        data: { finishedAt: now, durationMin, outcome: outcome || existing.outcome || null, byUser: byUser || existing.byUser || null }
      })
    } else if (roomId) {
      // create and finish a quick log
      log = await prisma.cleaningLog.create({
        data: {
          roomId: Number(roomId),
          taskId: taskId ? Number(taskId) : null,
          startedAt: now,
          finishedAt: now,
          durationMin: 1,
          outcome: outcome || null,
          byUser: byUser || null,
        }
      })
    } else {
      return res.status(400).json({ success: false, error: 'Provide logId or roomId' })
    }

    // Mark room clean if roomId available
    const rId = roomId || log.roomId
    if (rId) {
      const room = await prisma.room.update({ where: { id: Number(rId) }, data: { status: 'clean', updatedAt: now }, select: { id: true, roomNumber: true, floor: true, status: true, updatedAt: true } })
      const io = getIO();
      io && io.emit('hk:room:status', { room })
    }
    if (taskId) {
      await prisma.hkTask.update({ where: { id: Number(taskId) }, data: { status: 'DONE', updatedAt: now } })
      const io = getIO();
      io && io.emit('hk:task:updated', { taskId: Number(taskId), status: 'DONE' })
    }

    const io = getIO();
    io && io.emit('hk:cleaning:finish', { log })
    res.json({ success: true, log })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to finish cleaning' })
  }
}
