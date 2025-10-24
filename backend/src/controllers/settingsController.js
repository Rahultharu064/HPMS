import prisma from "../config/client.js";

const SETTINGS_KEY = 'hk.settings'

const defaultSettings = () => ({
  shifts: {
    MORNING: { start: '06:00', end: '12:00' },
    AFTERNOON: { start: '12:00', end: '18:00' },
    EVENING: { start: '18:00', end: '24:00' }
  },
  notifications: { enabled: true },
  priorities: { default: 'MEDIUM' }
})

export const getSettings = async (req, res) => {
  try {
    if (!prisma.appSetting || typeof prisma.appSetting.findUnique !== 'function') {
      return res.json({ success: true, data: defaultSettings(), note: 'Using defaults (run prisma migrate to enable persistence)' })
    }
    const row = await prisma.appSetting.findUnique({ where: { key: SETTINGS_KEY } })
    const value = (row?.value ?? defaultSettings())
    res.json({ success: true, data: value })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to load settings' })
  }
}

export const updateSettings = async (req, res) => {
  try {
    if (!prisma.appSetting || typeof prisma.appSetting.upsert !== 'function') {
      return res.status(501).json({ success: false, error: 'Settings persistence not available. Run prisma migrate to create tables.' })
    }
    const value = req.body ?? {}
    const saved = await prisma.appSetting.upsert({
      where: { key: SETTINGS_KEY },
      create: { key: SETTINGS_KEY, value, updatedAt: new Date() },
      update: { value, updatedAt: new Date() }
    })
    res.json({ success: true, data: saved.value })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to update settings' })
  }
}
