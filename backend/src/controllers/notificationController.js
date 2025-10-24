import prisma from "../config/client.js";

export const listNotifications = async (req, res) => {
  try {
    const { unread, limit = 100, offset = 0 } = req.query || {}
    const where = {}
    if (unread === 'true') where.read = false
    const take = Math.min(Number(limit) || 100, 500)
    const skip = Math.max(Number(offset) || 0, 0)
    const data = await prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip })
    res.json({ success: true, data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to list notifications' })
  }
}

export const markRead = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const n = await prisma.notification.update({ where: { id }, data: { read: true } })
    res.json({ success: true, data: n })
  } catch (err) {
    console.error(err)
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: 'Not found' })
    res.status(500).json({ success: false, error: 'Failed to mark read' })
  }
}
