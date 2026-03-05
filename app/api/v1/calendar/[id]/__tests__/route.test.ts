import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'
import { buildAuthContext, buildCalendarEntry } from '@/tests/factories'

const mockAuth = buildAuthContext({ role: 'editor' })
vi.mock('@/lib/auth/api-guard', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/auth/api-guard')>('@/lib/auth/api-guard')
  return {
    ...actual,
    requireApiRole: vi.fn().mockResolvedValue(mockAuth),
  }
})

const mockSupabase = createMockSupabaseClient()
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

vi.mock('@/lib/queue/scheduler', () => ({
  schedulePublish: vi.fn().mockResolvedValue('job-1'),
  cancelScheduledPublish: vi.fn().mockResolvedValue(undefined),
}))

function makeRequest(init?: RequestInit) {
  return new Request('http://localhost:3000/api/v1/calendar/cal-1', init)
}

const params = Promise.resolve({ id: 'cal-1' })

describe('PATCH /api/v1/calendar/[id]', () => {
  let PATCH: typeof import('@/app/api/v1/calendar/[id]/route').PATCH

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.update.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.returns.mockReturnValue(mockSupabase)

    const mod = await import('@/app/api/v1/calendar/[id]/route')
    PATCH = mod.PATCH
  })

  it('cancels a scheduled entry', async () => {
    const entry = buildCalendarEntry()

    // Fetch existing
    mockSupabase.single.mockResolvedValueOnce({ data: entry, error: null })
    // Update
    mockSupabase.single.mockResolvedValueOnce({
      data: { ...entry, status: 'cancelled' },
      error: null,
    })

    const req = makeRequest({
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })

    const res = await PATCH(req, { params })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.status).toBe('cancelled')
  })

  it('reschedules an entry', async () => {
    const entry = buildCalendarEntry()
    const newDate = new Date(Date.now() + 172800000).toISOString()

    // Fetch existing
    mockSupabase.single.mockResolvedValueOnce({ data: entry, error: null })
    // Update
    mockSupabase.single.mockResolvedValueOnce({
      data: { ...entry, scheduled_at: newDate },
      error: null,
    })

    const req = makeRequest({
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledAt: newDate }),
    })

    const res = await PATCH(req, { params })
    expect(res.status).toBe(200)
  })

  it('rejects update on non-scheduled entry', async () => {
    const entry = buildCalendarEntry({ status: 'published' })
    mockSupabase.single.mockResolvedValueOnce({ data: entry, error: null })

    const req = makeRequest({
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })

    const res = await PATCH(req, { params })
    expect(res.status).toBe(422)
  })

  it('rejects rescheduling to past time', async () => {
    const entry = buildCalendarEntry()
    const pastDate = new Date(Date.now() - 86400000).toISOString()

    mockSupabase.single.mockResolvedValueOnce({ data: entry, error: null })

    const req = makeRequest({
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledAt: pastDate }),
    })

    const res = await PATCH(req, { params })
    expect(res.status).toBe(422)
  })

  it('returns 404 for non-existent entry', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })

    const req = makeRequest({
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })

    const res = await PATCH(req, { params })
    expect(res.status).toBe(404)
  })

  it('returns 400 for empty body', async () => {
    const req = makeRequest({
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const res = await PATCH(req, { params })
    expect(res.status).toBe(400)
  })
})
