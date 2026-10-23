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
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue(mockSupabase),
}))

vi.mock('@/lib/leads/lead-scorer', () => ({
  scoreLead: vi.fn().mockReturnValue({ score: 65, scoreLabel: 'warm', reasons: ['test'] }),
}))

vi.mock('@/lib/email/resend', () => ({
  sendLeadNotification: vi.fn().mockResolvedValue(undefined),
}))

const mockClearRateLimits = vi.fn()
vi.mock('@/lib/leads/rate-limiter', () => ({
  isRateLimited: vi.fn().mockReturnValue(false),
  clearRateLimits: mockClearRateLimits,
}))

function validLeadBody() {
  return {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '(201) 555-1234',
    service: 'Interior Painting',
    message: 'Looking for a quote.',
    org_slug: 'cleanest-painting',
  }
}

describe('POST /api/v1/leads', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    // Default: org slug lookup succeeds, then lead insert succeeds. Reset first so
    // values queued but unused by an earlier test can't leak into this one.
    mockSupabase.single.mockReset()
    mockSupabase.single
      .mockResolvedValueOnce({ data: { id: 'org-1', settings: null }, error: null }) // org slug lookup
      .mockResolvedValueOnce({ data: { id: 'lead-1' }, error: null }) // lead insert
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
    mockSupabase.single
      .mockResolvedValueOnce({ data: { id: 'org-1', settings: null }, error: null }) // org lookup ok
      .mockResolvedValueOnce({ data: null, error: { message: 'DB error' } }) // lead insert fails
    const res = await callPost(validLeadBody())
    expect(res.status).toBe(500)
  })

  it('returns 404 when org_slug is not found', async () => {
    mockSupabase.single.mockReset()
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
    const res = await callPost(validLeadBody())
    expect(res.status).toBe(404)
  })

  function leadInsertRow(): Record<string, unknown> {
    const call = mockSupabase.insert.mock.calls.find(
      (c: unknown[]) => (c[0] as Record<string, unknown>).email !== undefined,
    )
    return call?.[0] as Record<string, unknown>
  }

  it('silently accepts honeypot submissions without storing or notifying', async () => {
    const { sendLeadNotification } = await import('@/lib/email/resend')
    const res = await callPost({ ...validLeadBody(), company_website: 'http://spam.example' })
    expect(res.status).toBe(201)
    expect(mockSupabase.insert).not.toHaveBeenCalled()
    expect(sendLeadNotification).not.toHaveBeenCalled()
  })

  it('stores discovery source and classified attribution', async () => {
    await callPost({
      ...validLeadBody(),
      discovery_source: 'ai_assistant',
      attribution: { landing_page: '/services/interior-painting', referrer_host: 'chatgpt.com' },
    })
    const row = leadInsertRow()
    expect(row.discovery_source).toBe('ai_assistant')
    expect(row.attribution).toEqual({
      landing_page: '/services/interior-painting',
      referrer_host: 'chatgpt.com',
      channel: 'ai_assistant',
    })
    expect(row.source).toBe('website')
  })

  it('maps Google Business Profile traffic onto source=gbp', async () => {
    await callPost({ ...validLeadBody(), attribution: { utm_source: 'gbp' } })
    expect(leadInsertRow().source).toBe('gbp')
  })

  it('marks submissions without attribution as direct', async () => {
    await callPost(validLeadBody())
    expect(leadInsertRow().attribution).toEqual({ channel: 'direct' })
  })

  it('rejects an unknown discovery source', async () => {
    const res = await callPost({ ...validLeadBody(), discovery_source: 'billboard' })
    expect(res.status).toBe(400)
  })

  // PGRST204 and 42703 are missing-column errors: the old fallback retried without the
  // attribution columns on those, so assert every failure now stops at one insert.
  it.each([
    ['23502', 'null value in column "name" violates not-null constraint'],
    ['PGRST204', "Could not find the 'attribution' column of 'leads' in the schema cache"],
    ['42703', 'column "discovery_source" of relation "leads" does not exist'],
  ])(
    'returns 500 without retrying or notifying when the insert fails (%s)',
    async (code, message) => {
      const { sendLeadNotification } = await import('@/lib/email/resend')
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockSupabase.single.mockReset()
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: 'org-1', settings: { contact_info: { email: 'owner@example.com' } } },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code, message, details: 'Failing row contains (Jane Doe, jane@example.com)' },
        })
        .mockResolvedValueOnce({ data: { id: 'lead-should-not-exist' }, error: null })

      const res = await callPost({ ...validLeadBody(), discovery_source: 'google_search' })

      expect(res.status).toBe(500)
      const leadInserts = mockSupabase.insert.mock.calls.filter(
        (c: unknown[]) => (c[0] as Record<string, unknown>).email !== undefined,
      )
      expect(leadInserts).toHaveLength(1)
      expect(mockSupabase.from).not.toHaveBeenCalledWith('lead_activities')
      expect(sendLeadNotification).not.toHaveBeenCalled()
      // The log carries the error code and message, never the row details.
      expect(errorSpy).toHaveBeenCalledWith('Failed to insert lead:', code, message)
      expect(JSON.stringify(errorSpy.mock.calls)).not.toContain('jane@example.com')
    },
  )

  it('files the lead under the org looked up by slug, ignoring a client-supplied org id', async () => {
    await callPost({ ...validLeadBody(), organization_id: 'someone-elses-org' })

    expect(mockSupabase.from).toHaveBeenCalledWith('organizations')
    expect(mockSupabase.eq).toHaveBeenCalledWith('slug', 'cleanest-painting')
    expect(leadInsertRow().organization_id).toBe('org-1')
    const activity = mockSupabase.insert.mock.calls
      .map((c: unknown[]) => c[0] as Record<string, unknown>)
      .find((row: Record<string, unknown>) => row.activity_type === 'score_change')
    expect(activity).toMatchObject({ organization_id: 'org-1', lead_id: 'lead-1' })
  })

  it('treats a referrer from the site itself as direct, not referral', async () => {
    const { POST } = await import('@/app/api/v1/leads/route')
    const request = new Request('https://cleanestpaintingnj.com/api/v1/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validLeadBody(),
        attribution: { landing_page: '/estimate', referrer_host: 'www.cleanestpaintingnj.com' },
      }),
    })

    const res = await POST(request)

    expect(res.status).toBe(201)
    expect(leadInsertRow().attribution).toEqual({
      landing_page: '/estimate',
      referrer_host: 'www.cleanestpaintingnj.com',
      channel: 'direct',
    })
    expect(leadInsertRow().source).toBe('website')
  })

  it('classifies a referrer from another site as referral', async () => {
    await callPost({ ...validLeadBody(), attribution: { referrer_host: 'houzz.com' } })
    expect((leadInsertRow().attribution as Record<string, unknown>).channel).toBe('referral')
  })

  it('includes the discovery source label in the notification email', async () => {
    const { sendLeadNotification } = await import('@/lib/email/resend')
    mockSupabase.single.mockReset()
    mockSupabase.single
      .mockResolvedValueOnce({
        data: { id: 'org-1', settings: { contact_info: { email: 'owner@example.com' } } },
        error: null,
      })
      .mockResolvedValueOnce({ data: { id: 'lead-1' }, error: null })

    await callPost({ ...validLeadBody(), discovery_source: 'google_maps' })

    expect(sendLeadNotification).toHaveBeenCalledWith(
      'owner@example.com',
      expect.objectContaining({ discoverySource: 'Google Maps / Business Profile' }),
    )
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
    const request = new NextRequest(
      `http://localhost/api/v1/leads${queryString ? `?${queryString}` : ''}`,
    )
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
    mockSupabase.returns.mockResolvedValueOnce({
      data: null,
      count: null,
      error: { message: 'fail' },
    })
    const res = await callGet()
    expect(res.status).toBe(500)
  })
})
