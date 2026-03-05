import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ---

const mockExchangeCodeForSession = vi.fn()
const mockGetUser = vi.fn()
const mockAdminFrom = vi.fn()

// Mock @supabase/ssr — createServerClient returns an object with auth methods
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
      getUser: mockGetUser,
    },
  })),
}))

// Mock admin client with chainable methods
const adminChain = {
  select: vi.fn(),
  insert: vi.fn(),
  eq: vi.fn(),
  limit: vi.fn(),
  order: vi.fn(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
}

// Wire up chainable methods
adminChain.select.mockReturnValue(adminChain)
adminChain.insert.mockReturnValue(adminChain)
adminChain.eq.mockReturnValue(adminChain)
adminChain.limit.mockReturnValue(adminChain)
adminChain.order.mockReturnValue(adminChain)

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: mockAdminFrom,
  })),
}))

const { GET } = await import('../route')

// --- Helpers ---

function makeCallbackRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/auth/callback')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return new Request(url.toString())
}

const TEST_USER_ID = '11111111-1111-1111-1111-111111111111'
const TEST_ORG_ID = '00000000-0000-0000-0000-000000000001'

// --- Tests ---

describe('GET /api/auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset chain returns
    adminChain.select.mockReturnValue(adminChain)
    adminChain.insert.mockReturnValue(adminChain)
    adminChain.eq.mockReturnValue(adminChain)
    adminChain.limit.mockReturnValue(adminChain)
    adminChain.order.mockReturnValue(adminChain)
    adminChain.single.mockResolvedValue({ data: null, error: null })
    adminChain.maybeSingle.mockResolvedValue({ data: null, error: null })
    mockAdminFrom.mockReturnValue(adminChain)
  })

  it('redirects to /login on missing code', async () => {
    const response = await GET(makeCallbackRequest())
    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/login')
  })

  it('redirects to /dashboard on successful auth', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null })
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } } })
    // User already has org membership
    adminChain.maybeSingle.mockResolvedValue({
      data: { id: 'existing-membership' },
      error: null,
    })

    const response = await GET(makeCallbackRequest({ code: 'valid-code' }))
    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/dashboard')
  })

  it('redirects to custom path when redirect param provided', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null })
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } } })
    adminChain.maybeSingle.mockResolvedValue({
      data: { id: 'existing-membership' },
      error: null,
    })

    const response = await GET(makeCallbackRequest({ code: 'valid-code', redirect: '/content' }))
    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/content')
  })

  it('sanitizes redirect to prevent open redirect', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null })
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } } })
    adminChain.maybeSingle.mockResolvedValue({
      data: { id: 'existing-membership' },
      error: null,
    })

    const response = await GET(makeCallbackRequest({ code: 'valid-code', redirect: '//evil.com' }))
    expect(new URL(response.headers.get('location')!).pathname).toBe('/dashboard')
  })

  it('redirects to /login on auth error', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      error: new Error('Invalid code'),
    })

    const response = await GET(makeCallbackRequest({ code: 'bad-code' }))
    expect(response.status).toBe(307)
    const location = new URL(response.headers.get('location')!)
    expect(location.pathname).toBe('/login')
    expect(location.searchParams.get('error')).toBe('auth_callback_failed')
  })

  describe('user-org auto-linking', () => {
    beforeEach(() => {
      mockExchangeCodeForSession.mockResolvedValue({ error: null })
      mockGetUser.mockResolvedValue({
        data: { user: { id: TEST_USER_ID } },
      })
    })

    it('creates user_organizations record for new user', async () => {
      // No existing membership
      adminChain.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
      // Org query returns first org
      adminChain.single.mockResolvedValueOnce({
        data: { id: TEST_ORG_ID },
        error: null,
      })
      // Insert succeeds
      adminChain.insert.mockResolvedValueOnce({ data: null, error: null })

      await GET(makeCallbackRequest({ code: 'valid-code' }))

      // Verify it checked for existing membership
      expect(mockAdminFrom).toHaveBeenCalledWith('user_organizations')
      // Verify it queried for an org
      expect(mockAdminFrom).toHaveBeenCalledWith('organizations')
      // Verify insert was called with correct payload
      expect(adminChain.insert).toHaveBeenCalledWith({
        user_id: TEST_USER_ID,
        organization_id: TEST_ORG_ID,
        role: 'owner',
        is_default: true,
      })
    })

    it('skips insert when user already has membership', async () => {
      adminChain.maybeSingle.mockResolvedValueOnce({
        data: { id: 'existing-record' },
        error: null,
      })

      await GET(makeCallbackRequest({ code: 'valid-code' }))

      // Should not query organizations or insert
      expect(mockAdminFrom).toHaveBeenCalledTimes(1) // only user_organizations check
      expect(adminChain.insert).not.toHaveBeenCalled()
    })

    it('skips insert when no organizations exist', async () => {
      // No existing membership
      adminChain.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
      // No orgs in DB
      adminChain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })

      const response = await GET(makeCallbackRequest({ code: 'valid-code' }))

      // Should still redirect successfully (guard will catch the no-org state)
      expect(response.status).toBe(307)
      expect(adminChain.insert).not.toHaveBeenCalled()
    })

    it('still redirects when getUser returns no user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      const response = await GET(makeCallbackRequest({ code: 'valid-code' }))

      expect(response.status).toBe(307)
      expect(new URL(response.headers.get('location')!).pathname).toBe('/dashboard')
      expect(mockAdminFrom).not.toHaveBeenCalled()
    })
  })
})
