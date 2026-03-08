import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { resolveDateRange } from '../date-range'

describe('resolveDateRange', () => {
  beforeEach(() => {
    // Fix time to 2026-03-08T12:00:00Z
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-08T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves 7d preset', () => {
    const result = resolveDateRange('7d')
    expect(result.current.endDate).toBe('2026-03-07') // yesterday
    expect(result.current.startDate).toBe('2026-03-01') // 7 days back
    // Previous period is 7 days before current start
    expect(result.previous.endDate).toBe('2026-02-28')
    expect(result.previous.startDate).toBe('2026-02-22')
  })

  it('resolves 28d preset', () => {
    const result = resolveDateRange('28d')
    expect(result.current.endDate).toBe('2026-03-07')
    expect(result.current.startDate).toBe('2026-02-08')
  })

  it('resolves 90d preset', () => {
    const result = resolveDateRange('90d')
    expect(result.current.endDate).toBe('2026-03-07')
    // 90 days back from Mar 7 = Dec 7
    expect(result.current.startDate).toBe('2025-12-08')
  })

  it('resolves custom date range', () => {
    const result = resolveDateRange('custom', '2026-02-01', '2026-02-28')
    expect(result.current.startDate).toBe('2026-02-01')
    expect(result.current.endDate).toBe('2026-02-28')
    // 28-day range, previous period ends Jan 31
    expect(result.previous.endDate).toBe('2026-01-31')
    expect(result.previous.startDate).toBe('2026-01-04')
  })

  it('throws if custom range missing dates', () => {
    expect(() => resolveDateRange('custom')).toThrow(
      'startDate and endDate are required for custom date range',
    )
  })

  it('throws if startDate after endDate', () => {
    expect(() => resolveDateRange('custom', '2026-03-10', '2026-03-01')).toThrow(
      'startDate must be before endDate',
    )
  })

  it('throws if date range exceeds 365 days', () => {
    expect(() => resolveDateRange('custom', '2025-01-01', '2026-03-01')).toThrow(
      'Date range cannot exceed 365 days',
    )
  })

  it('throws on invalid date format', () => {
    expect(() => resolveDateRange('custom', 'not-a-date', '2026-03-01')).toThrow(
      'Invalid date format',
    )
  })
})
