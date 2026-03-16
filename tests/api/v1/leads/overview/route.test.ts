import { describe, it, expect, vi, beforeEach } from 'vitest'
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

describe('GET /api/v1/leads/overview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireApiAuth.mockResolvedValue({
      userId: 'user-123',
      organizationId: 'org-456',
      role: 'editor',
    })
  })

  async function callGet() {
    const { GET } = await import('@/app/api/v1/leads/overview/route')
    return GET()
  }

  it('returns 401 when not authenticated', async () => {
    const { AuthError } = await import('@/lib/auth/api-guard')
    mockRequireApiAuth.mockRejectedValueOnce(new AuthError('Unauthorized', 401))
    const res = await callGet()
    expect(res.status).toBe(401)
  })

  it('returns empty overview when no leads', async () => {
    mockSupabase.returns.mockResolvedValueOnce({ data: [], error: null })
    const res = await callGet()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.total).toBe(0)
    expect(json.inPipeline).toBe(0)
    expect(json.conversionRate).toBe(0)
  })

  it('computes correct byStatus counts', async () => {
    const leads = [
      { status: 'new', source: 'website', service: 'Painting', created_at: new Date().toISOString(), contacted_at: null },
      { status: 'new', source: 'website', service: 'Painting', created_at: new Date().toISOString(), contacted_at: null },
      { status: 'won', source: 'phone', service: 'Deck Staining', created_at: '2026-03-10T12:00:00Z', contacted_at: '2026-03-10T14:00:00Z' },
      { status: 'lost', source: 'referral', service: null, created_at: '2026-03-08T12:00:00Z', contacted_at: '2026-03-09T12:00:00Z' },
    ]
    mockSupabase.returns.mockResolvedValueOnce({ data: leads, error: null })

    const res = await callGet()
    const json = await res.json()
    expect(json.byStatus.new).toBe(2)
    expect(json.byStatus.won).toBe(1)
    expect(json.byStatus.lost).toBe(1)
    expect(json.total).toBe(4)
  })

  it('computes conversion rate correctly', async () => {
    const leads = [
      { status: 'won', source: 'website', service: null, created_at: '2026-03-10T12:00:00Z', contacted_at: null },
      { status: 'won', source: 'website', service: null, created_at: '2026-03-10T12:00:00Z', contacted_at: null },
      { status: 'lost', source: 'website', service: null, created_at: '2026-03-10T12:00:00Z', contacted_at: null },
    ]
    mockSupabase.returns.mockResolvedValueOnce({ data: leads, error: null })

    const res = await callGet()
    const json = await res.json()
    // 2 won / (2 won + 1 lost) = 0.666...
    expect(json.conversionRate).toBeCloseTo(0.667, 2)
  })

  it('returns null avgResponseTimeHours when no contacted leads', async () => {
    const leads = [
      { status: 'new', source: 'website', service: null, created_at: new Date().toISOString(), contacted_at: null },
    ]
    mockSupabase.returns.mockResolvedValueOnce({ data: leads, error: null })

    const res = await callGet()
    const json = await res.json()
    expect(json.avgResponseTimeHours).toBeNull()
  })
})
