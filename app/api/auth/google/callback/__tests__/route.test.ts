import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// --- Mock fns ---

const mockExchangeCodeForTokens = vi.fn()
const mockValidateOAuthState = vi.fn()
const mockEncrypt = vi.fn()
const mockListSites = vi.fn()
const mockListAccountSummaries = vi.fn()
const mockListAccounts = vi.fn()
const mockListLocations = vi.fn()
const mockUpsert = vi.fn()

vi.mock('@/lib/google/oauth', () => ({
  exchangeCodeForTokens: mockExchangeCodeForTokens,
}))

vi.mock('@/lib/google/state', () => ({
  validateOAuthState: mockValidateOAuthState,
}))

vi.mock('@/lib/google/token-manager', () => ({
  encrypt: mockEncrypt,
}))

vi.mock('@/lib/google/search-console', () => ({
  listSites: mockListSites,
}))

vi.mock('@/lib/google/analytics', () => ({
  listAccountSummaries: mockListAccountSummaries,
}))

vi.mock('@/lib/google/business-profile', () => ({
  listAccounts: mockListAccounts,
  listLocations: mockListLocations,
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      upsert: mockUpsert,
    })),
  })),
}))

const { GET } = await import('../route')

// --- Helpers ---

const TEST_ORG_ID = '00000000-0000-0000-0000-000000000001'
const TEST_USER_ID = '11111111-1111-1111-1111-111111111111'

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/auth/google/callback')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return new NextRequest(url)
}

const validTokens = {
  access_token: 'ya29.test-access',
  refresh_token: '1//test-refresh',
  expires_in: 3600,
  token_type: 'Bearer',
  scope: 'https://www.googleapis.com/auth/analytics.readonly',
}

const validState = {
  organizationId: TEST_ORG_ID,
  userId: TEST_USER_ID,
  provider: 'analytics' as const,
}

function getRedirectUrl(response: Response): URL {
  return new URL(response.headers.get('location')!)
}

// --- Tests ---

describe('GET /api/auth/google/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEncrypt.mockReturnValue('encrypted-token')
    mockUpsert.mockResolvedValue({ error: null })
  })

  it('redirects with missing_params when code is absent', async () => {
    const response = await GET(makeRequest({ state: 'some-state' }))
    const url = getRedirectUrl(response)
    expect(url.searchParams.get('status')).toBe('error')
    expect(url.searchParams.get('message')).toBe('missing_params')
  })

  it('redirects with missing_params when state is absent', async () => {
    const response = await GET(makeRequest({ code: 'some-code' }))
    const url = getRedirectUrl(response)
    expect(url.searchParams.get('status')).toBe('error')
    expect(url.searchParams.get('message')).toBe('missing_params')
  })

  it('redirects with Google error when error param present', async () => {
    const response = await GET(makeRequest({ error: 'access_denied' }))
    const url = getRedirectUrl(response)
    expect(url.searchParams.get('status')).toBe('error')
    expect(url.searchParams.get('message')).toBe('access_denied')
  })

  it('redirects with invalid_state when HMAC validation fails', async () => {
    mockValidateOAuthState.mockReturnValue(null)

    const response = await GET(makeRequest({ code: 'test-code', state: 'bad-state' }))
    const url = getRedirectUrl(response)
    expect(url.searchParams.get('status')).toBe('error')
    expect(url.searchParams.get('message')).toBe('invalid_state')
  })

  it('saves connection and redirects with status=connected on success', async () => {
    mockValidateOAuthState.mockReturnValue(validState)
    mockExchangeCodeForTokens.mockResolvedValue(validTokens)
    mockListAccountSummaries.mockResolvedValue([
      { propertySummaries: [{ property: 'properties/123' }] },
    ])

    const response = await GET(makeRequest({ code: 'valid-code', state: 'valid-state' }))
    const url = getRedirectUrl(response)

    expect(url.searchParams.get('status')).toBe('connected')
    expect(url.searchParams.get('provider')).toBe('analytics')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: TEST_ORG_ID,
        provider: 'analytics',
        site_url: 'properties/123',
        access_token: 'encrypted-token',
        refresh_token: 'encrypted-token',
        status: 'active',
        connected_by: TEST_USER_ID,
      }),
      { onConflict: 'organization_id,provider' },
    )
  })

  it('still connects when resolveSiteUrl throws (non-fatal)', async () => {
    mockValidateOAuthState.mockReturnValue(validState)
    mockExchangeCodeForTokens.mockResolvedValue(validTokens)
    mockListAccountSummaries.mockRejectedValue(new Error('API not enabled'))

    const response = await GET(makeRequest({ code: 'valid-code', state: 'valid-state' }))
    const url = getRedirectUrl(response)

    expect(url.searchParams.get('status')).toBe('connected')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: TEST_ORG_ID,
        site_url: '',
      }),
      { onConflict: 'organization_id,provider' },
    )
  })

  it('redirects with db_error when upsert fails', async () => {
    mockValidateOAuthState.mockReturnValue(validState)
    mockExchangeCodeForTokens.mockResolvedValue(validTokens)
    mockListAccountSummaries.mockResolvedValue([])
    mockUpsert.mockResolvedValue({ error: { message: 'constraint violation' } })

    const response = await GET(makeRequest({ code: 'valid-code', state: 'valid-state' }))
    const url = getRedirectUrl(response)

    expect(url.searchParams.get('status')).toBe('error')
    expect(url.searchParams.get('message')).toBe('db_error')
  })

  it('redirects with token_exchange_failed and detail when exchangeCodeForTokens throws', async () => {
    mockValidateOAuthState.mockReturnValue(validState)
    mockExchangeCodeForTokens.mockRejectedValue(new Error('Invalid grant'))

    const response = await GET(makeRequest({ code: 'bad-code', state: 'valid-state' }))
    const url = getRedirectUrl(response)

    expect(url.searchParams.get('status')).toBe('error')
    expect(url.searchParams.get('message')).toBe('token_exchange_failed')
    expect(url.searchParams.get('detail')).toBe('Invalid grant')
  })

  it('resolves siteUrl via listSites for search_console provider', async () => {
    const scState = { ...validState, provider: 'search_console' as const }
    mockValidateOAuthState.mockReturnValue(scState)
    mockExchangeCodeForTokens.mockResolvedValue({
      ...validTokens,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    })
    mockListSites.mockResolvedValue([{ siteUrl: 'https://cleanestpainting.com' }])

    const response = await GET(makeRequest({ code: 'valid-code', state: 'valid-state' }))
    const url = getRedirectUrl(response)

    expect(url.searchParams.get('status')).toBe('connected')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        site_url: 'https://cleanestpainting.com',
        provider: 'search_console',
      }),
      { onConflict: 'organization_id,provider' },
    )
  })
})
