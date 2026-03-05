import { describe, it, expect } from 'vitest'
import { scheduleContentSchema, updateScheduleSchema, calendarQuerySchema } from '@/types/calendar'

describe('scheduleContentSchema', () => {
  it('accepts valid schedule request', () => {
    const result = scheduleContentSchema.safeParse({
      contentType: 'service_page',
      contentId: '00000000-0000-0000-0000-000000000001',
      scheduledAt: '2026-04-01T10:00:00Z',
    })
    expect(result.success).toBe(true)
  })

  it('accepts all content types', () => {
    for (const type of ['service_page', 'location_page', 'blog_post']) {
      const result = scheduleContentSchema.safeParse({
        contentType: type,
        contentId: '00000000-0000-0000-0000-000000000001',
        scheduledAt: '2026-04-01T10:00:00Z',
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid content type', () => {
    const result = scheduleContentSchema.safeParse({
      contentType: 'invalid',
      contentId: '00000000-0000-0000-0000-000000000001',
      scheduledAt: '2026-04-01T10:00:00Z',
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-uuid content ID', () => {
    const result = scheduleContentSchema.safeParse({
      contentType: 'service_page',
      contentId: 'not-a-uuid',
      scheduledAt: '2026-04-01T10:00:00Z',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid datetime', () => {
    const result = scheduleContentSchema.safeParse({
      contentType: 'service_page',
      contentId: '00000000-0000-0000-0000-000000000001',
      scheduledAt: 'not-a-date',
    })
    expect(result.success).toBe(false)
  })
})

describe('updateScheduleSchema', () => {
  it('accepts rescheduling with new datetime', () => {
    const result = updateScheduleSchema.safeParse({
      scheduledAt: '2026-05-01T10:00:00Z',
    })
    expect(result.success).toBe(true)
  })

  it('accepts cancellation', () => {
    const result = updateScheduleSchema.safeParse({
      status: 'cancelled',
    })
    expect(result.success).toBe(true)
  })

  it('accepts both fields', () => {
    const result = updateScheduleSchema.safeParse({
      scheduledAt: '2026-05-01T10:00:00Z',
      status: 'cancelled',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty object', () => {
    const result = updateScheduleSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects non-cancelled status', () => {
    const result = updateScheduleSchema.safeParse({
      status: 'published',
    })
    expect(result.success).toBe(false)
  })
})

describe('calendarQuerySchema', () => {
  it('accepts valid month and year', () => {
    const result = calendarQuerySchema.safeParse({ month: '3', year: '2026' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.month).toBe(3)
      expect(result.data.year).toBe(2026)
    }
  })

  it('coerces string numbers', () => {
    const result = calendarQuerySchema.safeParse({ month: '12', year: '2025' })
    expect(result.success).toBe(true)
  })

  it('rejects month out of range', () => {
    expect(calendarQuerySchema.safeParse({ month: '0', year: '2026' }).success).toBe(false)
    expect(calendarQuerySchema.safeParse({ month: '13', year: '2026' }).success).toBe(false)
  })

  it('rejects year out of range', () => {
    expect(calendarQuerySchema.safeParse({ month: '1', year: '2023' }).success).toBe(false)
    expect(calendarQuerySchema.safeParse({ month: '1', year: '2031' }).success).toBe(false)
  })
})
