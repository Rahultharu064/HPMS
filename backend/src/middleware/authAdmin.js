import dotenv from "dotenv"
dotenv.config()

// Simple admin auth for OTA endpoints using static token
// Provide ADMIN_API_TOKEN in environment, and send either:
// - Header: X-Admin-Token: <token>
// - Authorization: Bearer <token>
export default function authAdmin(req, res, next) {
  const token = process.env.ADMIN_API_TOKEN
  const disabled = String(process.env.DISABLE_ADMIN_AUTH || '').toLowerCase() === 'true'
  // Dev bypass: if explicitly disabled or token is not configured, allow through
  if (disabled || !token) return next()
  const headerToken = req.get("X-Admin-Token") || (req.get("Authorization") || "").replace(/^Bearer\s+/i, "")
  if (headerToken && headerToken === token) return next()
  return res.status(401).json({ ok: false, error: "Unauthorized" })
}
