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

// List schedule for a given day: rooms requiring cleaning today
// Combines: rooms with status 'needs-cleaning' and rooms with bookings checking out on the date
export const listCleaningSchedule = async (req, res) => {
  try {
    const dateStr = req.query.date
    const shift = (req.query.shift || '').toUpperCase() // MORNING | AFTERNOON | EVENING | ''
    const shiftStart = req.query.shiftStart // optional HH:MM
    const shiftEnd = req.query.shiftEnd     // optional HH:MM
    const base = dateStr ? new Date(dateStr) : new Date()
    const start = new Date(base)
    start.setHours(0,0,0,0)
    const end = new Date(base)
    end.setHours(23,59,59,999)

    // derive checkout window for shift filtering (optional)
    const winForShift = (sh) => ({
      MORNING: [6, 0, 12, 0],
      AFTERNOON: [12, 0, 18, 0],
      EVENING: [18, 0, 23, 59],
    }[sh] || null)
    let windowStart = new Date(start)
    let windowEnd = new Date(end)
    if (shift && winForShift(shift)) {
      const [shH, shM, ehH, ehM] = winForShift(shift)
      windowStart = new Date(start); windowStart.setHours(shH, shM, 0, 0)
      windowEnd = new Date(start); windowEnd.setHours(ehH, ehM, 59, 999)
    } else if (shiftStart && shiftEnd) {
      const [sH,sM] = String(shiftStart).split(':').map(Number)
      const [eH,eM] = String(shiftEnd).split(':').map(Number)
      if (Number.isFinite(sH) && Number.isFinite(sM) && Number.isFinite(eH) && Number.isFinite(eM)) {
        windowStart = new Date(start); windowStart.setHours(sH, sM, 0, 0)
        windowEnd = new Date(start); windowEnd.setHours(eH, eM, 59, 999)
      }
    }

    // Bookings checking out on the specified date
    const bookings = await prisma.booking.findMany({
      where: {
        checkOut: { gte: windowStart, lte: windowEnd },
      },
      select: {
        id: true,
        roomId: true,
        checkOut: true,
        status: true,
        room: { select: { id: true, roomNumber: true, floor: true, status: true } }
      }
    })

    // Rooms explicitly marked as needs-cleaning
    const dirtyRooms = await prisma.room.findMany({
      where: { status: 'needs-cleaning' },
      select: { id: true, roomNumber: true, floor: true, status: true }
    })

    // Merge sets by roomId
    const byRoom = new Map()
    for (const b of bookings) {
      byRoom.set(b.roomId, {
        roomId: b.roomId,
        roomNumber: b.room.roomNumber,
        floor: b.room.floor,
        status: b.room.status,
        checkoutTime: b.checkOut,
      })
    }
    for (const r of dirtyRooms) {
      if (!byRoom.has(r.id)) {
        byRoom.set(r.id, {
          roomId: r.id,
          roomNumber: r.roomNumber,
          floor: r.floor,
          status: r.status,
          checkoutTime: null,
        })
      }
    }

    const roomIds = Array.from(byRoom.keys())
    if (roomIds.length === 0) return res.json({ success: true, data: [] })

    // Find any active cleaning task per room to get assigned housekeeper
    const activeTasks = await prisma.hkTask.findMany({
      where: {
        roomId: { in: roomIds },
        type: 'cleaning',
        status: { notIn: ['DONE', 'CLOSED', 'CANCELLED'] }
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, roomId: true, assignedTo: true, status: true, title: true }
    })
    const firstTaskPerRoom = new Map()
    for (const t of activeTasks) {
      if (!firstTaskPerRoom.has(t.roomId)) firstTaskPerRoom.set(t.roomId, t)
    }

    const data = Array.from(byRoom.values()).map(item => {
      const t = firstTaskPerRoom.get(item.roomId)
      return {
        ...item,
        housekeeper: t?.assignedTo || null,
        taskId: t?.id || null,
        taskStatus: t?.status || null
      }
    }).sort((a,b) => {
      // sort by checkoutTime (nulls last), then by roomNumber
      const at = a.checkoutTime ? new Date(a.checkoutTime).getTime() : Infinity
      const bt = b.checkoutTime ? new Date(b.checkoutTime).getTime() : Infinity
      if (at !== bt) return at - bt
      const an = String(a.roomNumber)
      const bn = String(b.roomNumber)
      return an.localeCompare(bn)
    })

    res.json({ success: true, data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to fetch cleaning schedule' })
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
