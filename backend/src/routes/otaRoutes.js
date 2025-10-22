import express from "express"
import { syncToOta, importBookings, webhook, getLogs } from "../controllers/otaController.js"
import authAdmin from "../middleware/authAdmin.js"
import rateLimit from "../middleware/rateLimit.js"

const router = express.Router()

// POST /api/ota/sync  -> push rooms/rates/media
router.post("/sync", authAdmin, rateLimit({ windowMs: 60_000, max: 30 }), syncToOta)

// GET /api/ota/bookings?since=... -> pull bookings
router.get("/bookings", authAdmin, rateLimit({ windowMs: 60_000, max: 30 }), importBookings)

// POST /api/ota/webhook -> provider-initiated updates
router.post("/webhook", webhook)

// GET /api/ota/logs -> paginate logs
router.get("/logs", authAdmin, rateLimit({ windowMs: 60_000, max: 60 }), getLogs)

export default router
