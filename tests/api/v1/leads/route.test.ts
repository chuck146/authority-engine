import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

const mockRequireApiAuth = vi.fn()
vi.mock('@/lib/auth/api-guard', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/auth/api-guard')>()
  return { ...actual, requireApiAuth: mockRequireApiAuth }
})

const mockSupabase = createMockSupabaseClient()
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

vi.mock('@/lib/leads/lead-scorer', () => ({
  scoreLead: vi.fn().mockReturnValue({ score: 65, scoreLabel: 'warm', reasons: ['test'] }),
}))

vi.mock('@/lib/email/resend', () => ({
  sendLeadNotification: vi.fn().mockResolvedValue(undefined),
}))

function validLeadBody() {
  return {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '(201) 555-1234',
    service: 'Interior Painting',
    message: 'Looking for a quote.',
    organization_id: '00000000-0000-0000-0000-000000000001',
  }
}

describe('POST /api/v1/leads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: insert succeeds, org lookup returns settings
    mockSupabase.single
      .mockResolvedValueOnce({ data: { id: 'lead-1' }, error: null }) // lead insert
      .mockResolvedValueOnce({ data: { settings: null }, error: null }) // org lookup
  })

  async function callPost(body: Record<string, unknown>) {
    const { POST } = await import('@/app/api/v1/leads/route')
    const request = new Request('http://localhost/api/v1/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return POST(request)
  }

  it('returns 400 when required fields are missing', async () => {
    const res = await callPost({ email: 'a@b.com' })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Invalid request')
  })

  it('returns 400 for invalid email format', async () => {
    const res = await callPost({ ...validLeadBody(), email: 'not-an-email' })
    expect(res.status).toBe(400)
  })

  it('returns 201 on valid submission', async () => {
    const res = await callPost(validLeadBody())
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('inserts lead into the leads table', async () => {
    await callPost(validLeadBody())
    expect(mockSupabase.from).toHaveBeenCalledWith('leads')
    expect(mockSupabase.insert).toHaveBeenCalled()
  })

  it('creates a score_change activity', async () => {
    await callPost(validLeadBody())
    // from() called for: leads insert, lead_activities insert, organizations lookup
    const fromCalls = mockSupabase.from.mock.calls.map((c: unknown[]) => c[0])
    expect(fromCalls).toContain('lead_activities')
  })

  it('returns 500 when lead insert fails', async () => {
    mockSupabase.single.mockReset()
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })
    const res = await callPost(validLeadBody())
    expect(res.status).toBe(500)
  })
})

describe('GET /api/v1/leads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireApiAuth.mockResolvedValue({
      userId: 'user-123',
      organizationId: 'org-456',
      role: 'editor',
    })
    // Add range and or methods to mock chain
    ;(mockSupabase as Record<string, unknown>).range = vi.fn().mockReturnValue(mockSupabase)
    ;(mockSupabase as Record<string, unknown>).or = vi.fn().mockReturnValue(mockSupabase)
  })

  async function callGet(queryString = '') {
    const { GET } = await import('@/app/api/v1/leads/route')
    const request = new NextRequest(`http://localhost/api/v1/leads${queryString ? `?${queryString}` : ''}`)
    return GET(request)
  }

  it('returns 401 when not authenticated', async () => {
    const { AuthError } = await import('@/lib/auth/api-guard')
    mockRequireApiAuth.mockRejectedValueOnce(new AuthError('Unauthorized', 401))
    const res = await callGet()
    expect(res.status).toBe(401)
  })

  it('returns leads list with default pagination', async () => {
    const leadRow = {
      id: 'lead-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '555-1234',
      service: 'Interior Painting',
      status: 'new',
      source: 'website',
      score: 65,
      score_label: 'warm',
      assigned_to: null,
      created_at: '2026-03-16T12:00:00Z',
      updated_at: null,
    }
    mockSupabase.returns.mockResolvedValueOnce({ data: [leadRow], count: 1, error: null })

    const res = await callGet()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.items).toHaveLength(1)
    expect(json.items[0].name).toBe('Jane Doe')
    expect(json.total).toBe(1)
    expect(json.page).toBe(1)
  })

  it('applies status filter via query param', async () => {
    mockSupabase.returns.mockResolvedValueOnce({ data: [], count: 0, error: null })

    await callGet('status=contacted')
    // eq called for organization_id and status
    const eqCalls = mockSupabase.eq.mock.calls.map((c: unknown[]) => c[0])
    expect(eqCalls).toContain('status')
  })

  it('returns 500 when query fails', async () => {
    mockSupabase.returns.mockResolvedValueOnce({ data: null, count: null, error: { message: 'fail' } })
    const res = await callGet()
    expect(res.status).toBe(500)
  })
})
