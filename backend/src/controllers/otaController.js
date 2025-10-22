import crypto from "crypto"
import prisma from "../config/client.js"
import { getProvider } from "../services/ota/index.js"

export async function syncToOta(req, res) {
  const providerName = (req.body?.provider || "mock").toLowerCase()
  const provider = getProvider(providerName)
  const payload = req.body?.entities || {}
  try {
    const jobId = crypto.randomUUID()
    const t0 = Date.now()
    const result = await provider.push(payload)
    const durationMs = Date.now() - t0
    await prisma.otaSyncLog.create({
      data: {
        provider: providerName,
        direction: "push",
        status: result.status || "success",
        message: result.message || null,
        payloadSnippet: safeSnippet(payload),
        jobId,
        durationMs
      }
    })
    return res.json({ ok: true, provider: providerName, result })
  } catch (e) {
    const jobId = crypto.randomUUID()
    const durationMs = 0
    await prisma.otaSyncLog.create({
      data: {
        provider: providerName,
        direction: "push",
        status: "failed",
        message: e.message,
        payloadSnippet: safeSnippet(payload),
        jobId,
        durationMs,
        errorStack: e?.stack || null
      }
    })
    return res.status(500).json({ ok: false, error: e.message })
  }
}

export async function importBookings(req, res) {
  const providerName = (req.query?.provider || "mock").toLowerCase()
  const since = req.query?.since || null
  const provider = getProvider(providerName)
  try {
    const jobId = crypto.randomUUID()
    const t0 = Date.now()
    const pulled = await provider.pullBookings({ since })
    let imported = 0
    for (const b of pulled.bookings || []) {
      try {
        // Idempotency check
        if (b.externalId) {
          const exists = await prisma.externalBooking.findUnique({
            where: { provider_externalId: { provider: providerName, externalId: b.externalId } }
          })
          if (exists) {
            continue
          }
        }
        const guest = await upsertGuest(b.guest)
        const room = await findRoomByExternal(b)
        const created = await prisma.booking.create({
          data: {
            guestId: guest.id,
            roomId: room?.id || (await pickAnyRoomId()),
            checkIn: new Date(b.checkIn),
            checkOut: new Date(b.checkOut),
            adults: b.adults || 1,
            children: b.children || 0,
            totalAmount: b.totalAmount || 0,
            status: "pending",
            source: `ota:${providerName}`
          }
        })
        if (b.externalId) {
          await prisma.externalBooking.create({ data: { provider: providerName, externalId: b.externalId, note: String(created.id) } })
        }
        imported++
      } catch (inner) {
        await prisma.otaSyncLog.create({
          data: {
            provider: providerName,
            direction: "pull",
            status: "failed",
            message: `Booking import error: ${inner.message}`,
            payloadSnippet: safeSnippet(b),
            jobId,
            errorStack: inner?.stack || null
          }
        })
      }
    }
    const durationMs = Date.now() - t0
    await prisma.otaSyncLog.create({
      data: {
        provider: providerName,
        direction: "pull",
        status: "success",
        message: `Imported ${imported} bookings`,
        payloadSnippet: safeSnippet({ since, cursor: pulled.cursor }),
        jobId,
        durationMs
      }
    })
    return res.json({ ok: true, imported, cursor: pulled.cursor })
  } catch (e) {
    const jobId = crypto.randomUUID()
    await prisma.otaSyncLog.create({
      data: {
        provider: providerName,
        direction: "pull",
        status: "failed",
        message: e.message,
        payloadSnippet: safeSnippet({ since }),
        jobId,
        errorStack: e?.stack || null
      }
    })
    return res.status(500).json({ ok: false, error: e.message })
  }
}

export async function webhook(req, res) {
  const providerName = (req.query?.provider || "mock").toLowerCase()
  const provider = getProvider(providerName)
  const payload = req.body || {}
  try {
    const jobId = crypto.randomUUID()
    const t0 = Date.now()
    const result = await provider.handleWebhook(payload)
    const durationMs = Date.now() - t0
    await prisma.otaSyncLog.create({
      data: {
        provider: providerName,
        direction: "webhook",
        status: "success",
        message: `Webhook ${result.type}`,
        payloadSnippet: safeSnippet(payload),
        jobId,
        durationMs
      }
    })
    return res.json({ ok: true })
  } catch (e) {
    const jobId = crypto.randomUUID()
    await prisma.otaSyncLog.create({
      data: {
        provider: providerName,
        direction: "webhook",
        status: "failed",
        message: e.message,
        payloadSnippet: safeSnippet(payload),
        jobId,
        errorStack: e?.stack || null
      }
    })
    return res.status(500).json({ ok: false, error: e.message })
  }
}

export async function getLogs(req, res) {
  const page = Number(req.query.page || 1)
  const pageSize = Math.min(Number(req.query.pageSize || 20), 100)
  const skip = (page - 1) * pageSize
  const [items, total] = await Promise.all([
    prisma.otaSyncLog.findMany({ orderBy: { createdAt: "desc" }, skip, take: pageSize }),
    prisma.otaSyncLog.count()
  ])
  return res.json({ ok: true, items, page, pageSize, total })
}

// Helpers
function safeSnippet(obj) {
  try {
    const json = JSON.stringify(obj)
    return json.length > 2000 ? json.slice(0, 2000) + "..." : json
  } catch { return null }
}

async function upsertGuest(guest) {
  if (!guest) {
    // fallback ghost guest
    return prisma.guest.create({ data: { firstName: "OTA", lastName: "Guest", email: `ota-${Date.now()}@example.com`, phone: `${Date.now()}` } })
  }
  const { email, phone, firstName = "", lastName = "" } = guest
  // Prefer email, else phone; ensure at least one unique
  if (email) {
    try {
      return await prisma.guest.upsert({
        where: { email },
        update: { firstName, lastName, phone: phone || `${Date.now()}` },
        create: { firstName, lastName, email, phone: phone || `${Date.now()}` }
      })
    } catch {}
  }
  if (phone) {
    return await prisma.guest.upsert({
      where: { phone },
      update: { firstName, lastName, email: email || `ota-${Date.now()}@example.com` },
      create: { firstName, lastName, phone, email: email || `ota-${Date.now()}@example.com` }
    })
  }
  return prisma.guest.create({ data: { firstName: firstName || "OTA", lastName: lastName || "Guest", email: `ota-${Date.now()}@example.com`, phone: `${Date.now()}` } })
}

async function findRoomByExternal(b) {
  if (b.roomId) {
    try { return await prisma.room.findUnique({ where: { id: b.roomId } }) } catch {}
  }
  if (b.roomNumber) {
    try { return await prisma.room.findUnique({ where: { roomNumber: b.roomNumber } }) } catch {}
  }
  return null
}

async function pickAnyRoomId() {
  const r = await prisma.room.findFirst({ select: { id: true } })
  if (!r) throw new Error("No rooms available to assign booking")
  return r.id
}
