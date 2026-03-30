// In-memory rate limiter for public endpoints.
// Suitable for single-instance deployments (Vercel serverless).
// For multi-instance, replace with Redis-backed limiter (Upstash).
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 5 // 5 submissions per IP per hour
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000 // clean stale entries every 10 min
let lastCleanup = Date.now()

function cleanupStaleEntries(): void {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [ip, timestamps] of rateLimitMap) {
    const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
    if (recent.length === 0) {
      rateLimitMap.delete(ip)
    } else {
      rateLimitMap.set(ip, recent)
    }
  }
}

export function isRateLimited(ip: string): boolean {
  cleanupStaleEntries()
  const now = Date.now()
  const timestamps = rateLimitMap.get(ip) ?? []
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  if (recent.length >= RATE_LIMIT_MAX) return true
  recent.push(now)
  rateLimitMap.set(ip, recent)
  return false
}

export function clearRateLimits(): void {
  rateLimitMap.clear()
}
