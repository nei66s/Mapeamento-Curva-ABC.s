type Entry = { count: number; firstAt: number }

const BUCKET = new Map<string, Entry>()

export function checkRateLimit(key: string, limit = 6, windowMs = 60 * 1000) {
  const now = Date.now()
  const e = BUCKET.get(key)
  if (!e) {
    BUCKET.set(key, { count: 1, firstAt: now })
    return { ok: true, remaining: limit - 1 }
  }
  if (now - e.firstAt > windowMs) {
    BUCKET.set(key, { count: 1, firstAt: now })
    return { ok: true, remaining: limit - 1 }
  }
  e.count++
  BUCKET.set(key, e)
  if (e.count > limit) return { ok: false, remaining: 0 }
  return { ok: true, remaining: Math.max(0, limit - e.count) }
}
