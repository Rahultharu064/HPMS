// Very simple in-memory rate limiter per route+ip
// Not production-grade; replace with Redis-backed limiter later
const buckets = new Map()

export default function rateLimit({ windowMs = 60_000, max = 60 } = {}) {
  return function (req, res, next) {
    const key = `${req.ip}:${req.baseUrl}${req.path}`
    const now = Date.now()
    const bucket = buckets.get(key) || { reset: now + windowMs, count: 0 }
    if (now > bucket.reset) {
      bucket.reset = now + windowMs
      bucket.count = 0
    }
    bucket.count++
    buckets.set(key, bucket)
    res.setHeader('X-RateLimit-Limit', String(max))
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - bucket.count)))
    res.setHeader('X-RateLimit-Reset', String(Math.floor(bucket.reset / 1000)))
    if (bucket.count > max) return res.status(429).json({ ok: false, error: 'Too Many Requests' })
    next()
  }
}
