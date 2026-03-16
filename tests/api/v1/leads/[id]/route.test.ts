import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

const mockRequireApiAuth = vi.fn()
const mockRequireApiRole = vi.fn()
vi.mock('@/lib/auth/api-guard', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/auth/api-guard')>()
  return { ...actual, requireApiAuth: mockRequireApiAuth, requireApiRole: mockRequireApiRole }
})

const mockSupabase = createMockSupabaseClient()
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

const context = { params: Promise.resolve({ id: 'lead-1' }) }

const leadRow = {
  id: 'lead-1',
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '555-1234',
  service: 'Interior Painting',
  message: 'Need a quote',
  status: 'new',
  source: 'website',
  score: 65,
  score_label: 'warm',
  assigned_to: null,
  notes: null,
  contacted_at: null,
  closed_at: null,
  close_reason: null,
  created_at: '2026-03-16T12:00:00Z',
  updated_at: null,
}

function resetChain() {
  // Re-wire chainable methods after clearAllMocks
  mockSupabase.from.mockReturnValue(mockSupabase)
  mockSupabase.select.mockReturnValue(mockSupabase)
  mockSupabase.insert.mockReturnValue(mockSupabase)
  mockSupabase.update.mockReturnValue(mockSupabase)
  mockSupabase.delete.mockReturnValue(mockSupabase)
  mockSupabase.eq.mockReturnValue(mockSupabase)
  mockSupabase.neq.mockReturnValue(mockSupabase)
  mockSupabase.in.mockReturnValue(mockSupabase)
  mockSupabase.gte.mockReturnValue(mockSupabase)
  mockSupabase.lte.mockReturnValue(mockSupabase)
  mockSupabase.order.mockReturnValue(mockSupabase)
  mockSupabase.limit.mockReturnValue(mockSupabase)
  mockSupabase.returns.mockReturnValue(mockSupabase)
  mockSupabase.single.mockResolvedValue({ data: null, error: null })
  mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null })
}

describe('GET /api/v1/leads/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetChain()
    mockRequireApiAuth.mockResolvedValue({
      userId: 'user-123',
      organizationId: 'org-456',
      role: 'editor',
    })
  })

  async function callGet() {
    const { GET } = await import('@/app/api/v1/leads/[id]/route')
    return GET(new Request('http://localhost/api/v1/leads/lead-1'), context)
  }

  it('returns 401 when not authenticated', async () => {
    const { AuthError } = await import('@/lib/auth/api-guard')
    mockRequireApiAuth.mockRejectedValueOnce(new AuthError('Unauthorized', 401))
    const res = await callGet()
    expect(res.status).toBe(401)
  })

  it('returns 404 when lead not found', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
    const res = await callGet()
    expect(res.status).toBe(404)
  })

  it('returns lead detail with activities and followups', async () => {
    // Lead query: from → select → eq → eq → returns(chain) → single(lead)
    mockSupabase.single.mockResolvedValueOnce({ data: leadRow, error: null })
    // Activities query: from → select → eq → eq → order → limit → returns(promise)
    // Followups query: from → select → eq → eq → order → returns(promise)
    mockSupabase.returns
      .mockReturnValueOnce(mockSupabase) // lead query: keep chain for .single()
      .mockResolvedValueOnce({
        data: [
          {
            id: 'act-1',
            activity_type: 'status_change',
            description: 'Created',
            metadata: {},
            created_by: 'user-123',
            created_at: '2026-03-16T12:00:00Z',
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({ data: [], error: null })

    const res = await callGet()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.name).toBe('Jane Doe')
    expect(json.activities).toHaveLength(1)
    expect(json.followups).toHaveLength(0)
  })
})

describe('PATCH /api/v1/leads/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetChain()
    mockRequireApiRole.mockResolvedValue({
      userId: 'user-123',
      organizationId: 'org-456',
      role: 'editor',
    })
  })

  async function callPatch(body: Record<string, unknown>) {
    const { PATCH } = await import('@/app/api/v1/leads/[id]/route')
    const request = new Request('http://localhost/api/v1/leads/lead-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return PATCH(request, context)
  }

  it('returns 401 when not authenticated', async () => {
    const { AuthError } = await import('@/lib/auth/api-guard')
    mockRequireApiRole.mockRejectedValueOnce(new AuthError('Unauthorized', 401))
    const res = await callPatch({ status: 'contacted' })
    expect(res.status).toBe(401)
  })

  it('returns 400 for empty body', async () => {
    const res = await callPatch({})
    expect(res.status).toBe(400)
  })

  it('returns 404 when lead not found', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
    const res = await callPatch({ status: 'contacted' })
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid status transition (new → won)', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: { ...leadRow, status: 'new' }, error: null })
    const res = await callPatch({ status: 'won' })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Cannot transition')
  })

  it('returns 403 when editor tries to mark won', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: { ...leadRow, status: 'qualified' },
      error: null,
    })
    const res = await callPatch({ status: 'won' })
    expect(res.status).toBe(403)
  })

  it('allows valid status change (new → contacted)', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: { ...leadRow, status: 'new' }, error: null })
    const res = await callPatch({ status: 'contacted' })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('updates notes without status change', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: leadRow, error: null })
    const res = await callPatch({ notes: 'Called customer' })
    expect(res.status).toBe(200)
    expect(mockSupabase.update).toHaveBeenCalled()
  })
})
