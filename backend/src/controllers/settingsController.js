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

// Get service charge percentage
export const getServiceCharge = async (req, res) => {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: 'service_charge_percentage' }
    });

    const serviceCharge = setting?.value || 10; // Default 10%
    res.json({ serviceChargePercentage: serviceCharge });
  } catch (error) {
    console.error('Error fetching service charge:', error);
    res.status(500).json({ error: 'Failed to fetch service charge' });
  }
};

// Update service charge percentage
export const updateServiceCharge = async (req, res) => {
  try {
    const { percentage } = req.body;

    // Validate percentage
    const value = parseFloat(percentage);
    if (isNaN(value) || value < 0 || value > 100) {
      return res.status(400).json({ error: 'Service charge percentage must be between 0 and 100' });
    }

    const setting = await prisma.appSetting.upsert({
      where: { key: 'service_charge_percentage' },
      update: {
        value: value,
        updatedAt: new Date()
      },
      create: {
        key: 'service_charge_percentage',
        value: value
      }
    });

    res.json({
      message: 'Service charge updated successfully',
      serviceChargePercentage: setting.value
    });
  } catch (error) {
    console.error('Error updating service charge:', error);
    res.status(500).json({ error: 'Failed to update service charge' });
  }
};
