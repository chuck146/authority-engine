import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRateLimiter } from '@/lib/leads/rate-limiter'

describe('createRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-22T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows up to max hits within the window, then blocks', () => {
    const limiter = createRateLimiter({ max: 3, windowMs: 60_000 })
    expect(limiter.isLimited('ip-1')).toBe(false)
    expect(limiter.isLimited('ip-1')).toBe(false)
    expect(limiter.isLimited('ip-1')).toBe(false)
    expect(limiter.isLimited('ip-1')).toBe(true)
    expect(limiter.isLimited('ip-1')).toBe(true)
  })

  it('allows again once the window has passed', () => {
    const limiter = createRateLimiter({ max: 2, windowMs: 60_000 })
    limiter.isLimited('ip-1')
    limiter.isLimited('ip-1')
    expect(limiter.isLimited('ip-1')).toBe(true)

    vi.advanceTimersByTime(59_999)
    expect(limiter.isLimited('ip-1')).toBe(true)

    vi.advanceTimersByTime(1)
    expect(limiter.isLimited('ip-1')).toBe(false)
  })

  it('does not extend the window with blocked hits', () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 1_000 })
    expect(limiter.isLimited('ip-1')).toBe(false)
    vi.advanceTimersByTime(500)
    expect(limiter.isLimited('ip-1')).toBe(true)
    vi.advanceTimersByTime(500)
    expect(limiter.isLimited('ip-1')).toBe(false)
  })

  it('tracks keys separately', () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60_000 })
    expect(limiter.isLimited('ip-1')).toBe(false)
    expect(limiter.isLimited('ip-1')).toBe(true)
    expect(limiter.isLimited('ip-2')).toBe(false)
  })

  it('gives each limiter instance an independent budget', () => {
    const a = createRateLimiter({ max: 1, windowMs: 60_000 })
    const b = createRateLimiter({ max: 1, windowMs: 60_000 })
    expect(a.isLimited('ip-1')).toBe(false)
    expect(a.isLimited('ip-1')).toBe(true)
    expect(b.isLimited('ip-1')).toBe(false)
  })

  it('clear() resets the budget', () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60_000 })
    limiter.isLimited('ip-1')
    expect(limiter.isLimited('ip-1')).toBe(true)
    limiter.clear()
    expect(limiter.isLimited('ip-1')).toBe(false)
  })
})
