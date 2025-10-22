import prisma from "../../config/client.js";

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
    res.status(201).json({ success: true, log })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to create cleaning log' })
  }
}
