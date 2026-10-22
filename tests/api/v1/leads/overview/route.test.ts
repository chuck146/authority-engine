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
      {
        status: 'new',
        source: 'website',
        service: 'Painting',
        created_at: new Date().toISOString(),
        contacted_at: null,
      },
      {
        status: 'new',
        source: 'website',
        service: 'Painting',
        created_at: new Date().toISOString(),
        contacted_at: null,
      },
      {
        status: 'won',
        source: 'phone',
        service: 'Deck Staining',
        created_at: '2026-03-10T12:00:00Z',
        contacted_at: '2026-03-10T14:00:00Z',
      },
      {
        status: 'lost',
        source: 'referral',
        service: null,
        created_at: '2026-03-08T12:00:00Z',
        contacted_at: '2026-03-09T12:00:00Z',
      },
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
      {
        status: 'won',
        source: 'website',
        service: null,
        created_at: '2026-03-10T12:00:00Z',
        contacted_at: null,
      },
      {
        status: 'won',
        source: 'website',
        service: null,
        created_at: '2026-03-10T12:00:00Z',
        contacted_at: null,
      },
      {
        status: 'lost',
        source: 'website',
        service: null,
        created_at: '2026-03-10T12:00:00Z',
        contacted_at: null,
      },
    ]
    mockSupabase.returns.mockResolvedValueOnce({ data: leads, error: null })

    const res = await callGet()
    const json = await res.json()
    // 2 won / (2 won + 1 lost) = 0.666...
    expect(json.conversionRate).toBeCloseTo(0.667, 2)
  })

  it('returns null avgResponseTimeHours when no contacted leads', async () => {
    const leads = [
      {
        status: 'new',
        source: 'website',
        service: null,
        created_at: new Date().toISOString(),
        contacted_at: null,
      },
    ]
    mockSupabase.returns.mockResolvedValueOnce({ data: leads, error: null })

    const res = await callGet()
    const json = await res.json()
    expect(json.avgResponseTimeHours).toBeNull()
  })

  it('breaks leads down by observed channel and reported discovery source', async () => {
    const base = {
      source: 'website',
      service: null,
      created_at: new Date().toISOString(),
      contacted_at: null,
    }
    mockSupabase.returns.mockResolvedValueOnce({
      data: [
        {
          ...base,
          status: 'won',
          attribution: { channel: 'ai_assistant' },
          discovery_source: 'ai_assistant',
        },
        {
          ...base,
          status: 'qualified',
          attribution: { channel: 'ai_assistant' },
          discovery_source: 'google_search',
        },
        {
          ...base,
          status: 'new',
          attribution: { channel: 'organic_search' },
          discovery_source: null,
        },
        // Lead created before the attribution migration
        { ...base, status: 'lost' },
      ],
      error: null,
    })

    const json = await (await callGet()).json()

    expect(json.byChannel).toEqual([
      { channel: 'ai_assistant', leads: 2, qualified: 2, won: 1 },
      { channel: 'organic_search', leads: 1, qualified: 0, won: 0 },
      { channel: 'unknown', leads: 1, qualified: 0, won: 0 },
    ])
    expect(json.byDiscoverySource).toEqual([
      { source: 'ai_assistant', count: 1 },
      { source: 'google_search', count: 1 },
    ])
  })

  it('selects explicit columns only (no PII, no *) including attribution', async () => {
    mockSupabase.returns.mockResolvedValueOnce({ data: [], error: null })
    await callGet()

    expect(mockSupabase.select).toHaveBeenCalledTimes(1)
    const columns = mockSupabase.select.mock.calls[0]?.[0] as string
    expect(columns).not.toContain('*')
    expect(columns).toContain('discovery_source')
    expect(columns).toContain('attribution')
    const list = columns.split(',').map((c) => c.trim())
    for (const pii of ['name', 'email', 'phone', 'message']) {
      expect(list).not.toContain(pii)
    }
    expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', 'org-456')
  })

  it('retries with base columns when attribution columns are missing (42703)', async () => {
    const base = { source: 'website', service: null, created_at: new Date().toISOString() }
    mockSupabase.returns
      .mockResolvedValueOnce({
        data: null,
        error: { code: '42703', message: 'column leads.discovery_source does not exist' },
      })
      .mockResolvedValueOnce({
        data: [
          { ...base, status: 'new', contacted_at: null },
          { ...base, status: 'won', contacted_at: null },
        ],
        error: null,
      })

    const res = await callGet()

    expect(res.status).toBe(200)
    expect(mockSupabase.select).toHaveBeenCalledTimes(2)
    const retryColumns = mockSupabase.select.mock.calls[1]?.[0] as string
    expect(retryColumns).not.toContain('attribution')
    expect(retryColumns).not.toContain('discovery_source')
    expect(retryColumns).not.toContain('*')

    const json = await res.json()
    expect(json.total).toBe(2)
    expect(json.byChannel).toEqual([{ channel: 'unknown', leads: 2, qualified: 1, won: 1 }])
    expect(json.byDiscoverySource).toEqual([])
  })

  it('returns 500 for other query errors without retrying', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockSupabase.returns.mockResolvedValueOnce({
      data: null,
      error: { code: '42501', message: 'permission denied' },
    })
    const res = await callGet()
    expect(res.status).toBe(500)
    expect(mockSupabase.select).toHaveBeenCalledTimes(1)
  })

  it('counts qualified, proposed and won as qualified per channel', async () => {
    const base = {
      source: 'website',
      service: null,
      created_at: new Date().toISOString(),
      contacted_at: null,
      attribution: { channel: 'organic_search' },
      discovery_source: null,
    }
    mockSupabase.returns.mockResolvedValueOnce({
      data: ['new', 'contacted', 'qualified', 'proposed', 'won', 'lost'].map((status) => ({
        ...base,
        status,
      })),
      error: null,
    })

    const json = await (await callGet()).json()
    expect(json.byChannel).toEqual([{ channel: 'organic_search', leads: 6, qualified: 3, won: 1 }])
  })
})
