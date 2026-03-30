// Per-user rate limiter for authenticated, resource-intensive endpoints
// (AI generation, file uploads). Prevents credit abuse.
const userRateLimitMap = new Map<string, number[]>()
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000
let lastCleanup = Date.now()

type RateLimitConfig = {
  windowMs: number
  max: number
}

const DEFAULTS: RateLimitConfig = {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 requests per hour
}

function cleanupStaleEntries(windowMs: number): void {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, timestamps] of userRateLimitMap) {
    const recent = timestamps.filter((t) => now - t < windowMs)
    if (recent.length === 0) {
      userRateLimitMap.delete(key)
    } else {
      userRateLimitMap.set(key, recent)
    }
  }
}

export function isUserRateLimited(
  userId: string,
  action: string,
  config: Partial<RateLimitConfig> = {},
): boolean {
  const { windowMs, max } = { ...DEFAULTS, ...config }
  const key = `${userId}:${action}`
  cleanupStaleEntries(windowMs)
  const now = Date.now()
  const timestamps = userRateLimitMap.get(key) ?? []
  const recent = timestamps.filter((t) => now - t < windowMs)
  if (recent.length >= max) return true
  recent.push(now)
  userRateLimitMap.set(key, recent)
  return false
}
