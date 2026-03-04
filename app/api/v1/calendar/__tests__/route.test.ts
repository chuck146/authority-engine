import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'
import { buildAuthContext, buildCalendarEntry } from '@/tests/factories'

// Mock dependencies
const mockAuth = buildAuthContext({ role: 'editor' })
vi.mock('@/lib/auth/api-guard', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth/api-guard')>('@/lib/auth/api-guard')
  return {
    ...actual,
    requireApiAuth: vi.fn().mockResolvedValue(mockAuth),
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

function makeRequest(url: string, init?: RequestInit) {
  return new Request(`http://localhost:3000${url}`, init)
}

describe('GET /api/v1/calendar', () => {
  let GET: typeof import('@/app/api/v1/calendar/route').GET

  beforeEach(async () => {
    vi.clearAllMocks()
    // Re-wire chain
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.gte.mockReturnValue(mockSupabase)
    mockSupabase.lte.mockReturnValue(mockSupabase)
    mockSupabase.order.mockReturnValue(mockSupabase)
    mockSupabase.returns.mockReturnValue(mockSupabase)
    mockSupabase.in.mockReturnValue(mockSupabase)

    const mod = await import('@/app/api/v1/calendar/route')
    GET = mod.GET
  })

  it('returns calendar entries for a month', async () => {
    const entries = [buildCalendarEntry()]

    // First call: calendar entries
    mockSupabase.returns.mockResolvedValueOnce({ data: entries, error: null })
    // Second call: content titles
    mockSupabase.returns.mockResolvedValueOnce({
      data: [{ id: 'content-789', title: 'Interior Painting' }],
      error: null,
    })

    const req = makeRequest('/api/v1/calendar?month=4&year=2026')
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0].contentTitle).toBe('Interior Painting')
    expect(data[0].status).toBe('scheduled')
  })

  it('returns 400 for missing query params', async () => {
    const req = makeRequest('/api/v1/calendar')
    const res = await GET(req)

    expect(res.status).toBe(400)
  })

  it('returns empty array when no entries', async () => {
    mockSupabase.returns.mockResolvedValueOnce({ data: [], error: null })

    const req = makeRequest('/api/v1/calendar?month=4&year=2026')
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual([])
  })
})

describe('POST /api/v1/calendar', () => {
  let POST: typeof import('@/app/api/v1/calendar/route').POST

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.insert.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.returns.mockReturnValue(mockSupabase)

    const mod = await import('@/app/api/v1/calendar/route')
    POST = mod.POST
  })

  it('schedules approved content', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString()

    // Content lookup
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'content-789', status: 'approved' },
      error: null,
    })

    // Insert calendar entry
    const entry = buildCalendarEntry({ scheduled_at: futureDate })
    mockSupabase.single.mockResolvedValueOnce({ data: entry, error: null })

    const req = makeRequest('/api/v1/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentType: 'service_page',
        contentId: '00000000-0000-0000-0000-000000000001',
        scheduledAt: futureDate,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it('rejects scheduling non-approved content', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString()

    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'content-789', status: 'draft' },
      error: null,
    })

    const req = makeRequest('/api/v1/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentType: 'service_page',
        contentId: '00000000-0000-0000-0000-000000000001',
        scheduledAt: futureDate,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(422)
  })

  it('rejects past scheduled time', async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString()

    const req = makeRequest('/api/v1/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentType: 'service_page',
        contentId: '00000000-0000-0000-0000-000000000001',
        scheduledAt: pastDate,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(422)
  })

  it('returns 400 for invalid body', async () => {
    const req = makeRequest('/api/v1/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalid: true }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
