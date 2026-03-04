import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthContext } from '@/tests/factories'

const mockAuth = buildAuthContext({ role: 'admin' })

vi.mock('@/lib/auth/api-guard', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/auth/api-guard')>()
  return {
    ...actual,
    requireApiAuth: vi.fn().mockResolvedValue(mockAuth),
  }
})

vi.mock('@/lib/google/token-manager', () => ({
  getValidToken: vi.fn().mockResolvedValue({ accessToken: 'ya29.test', siteUrl: null }),
}))

const mockListAccountSummaries = vi.fn()
vi.mock('@/lib/google/analytics', () => ({
  listAccountSummaries: mockListAccountSummaries,
}))

describe('GET /api/v1/integrations/ga4/properties', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns flattened list of GA4 properties', async () => {
    mockListAccountSummaries.mockResolvedValueOnce([
      {
        name: 'accountSummaries/111',
        account: 'accounts/111',
        displayName: 'Cleanest Painting',
        propertySummaries: [
          { property: 'properties/222', displayName: 'Main Site', propertyType: 'PROPERTY_TYPE_ORDINARY', parent: 'accounts/111' },
          { property: 'properties/333', displayName: 'Blog', propertyType: 'PROPERTY_TYPE_ORDINARY', parent: 'accounts/111' },
        ],
      },
    ])

    const { GET } = await import('../route')
    const res = await GET()
    const json = await res.json()

    expect(json.properties).toHaveLength(2)
    expect(json.properties[0]).toEqual({
      propertyId: 'properties/222',
      displayName: 'Main Site',
      accountName: 'Cleanest Painting',
    })
    expect(json.properties[1]).toEqual({
      propertyId: 'properties/333',
      displayName: 'Blog',
      accountName: 'Cleanest Painting',
    })
  })

  it('returns empty array when no accounts', async () => {
    mockListAccountSummaries.mockResolvedValueOnce([])

    const { GET } = await import('../route')
    const res = await GET()
    const json = await res.json()

    expect(json.properties).toEqual([])
  })

  it('handles accounts with no properties gracefully', async () => {
    mockListAccountSummaries.mockResolvedValueOnce([
      {
        name: 'accountSummaries/111',
        account: 'accounts/111',
        displayName: 'Empty Account',
        propertySummaries: undefined,
      },
    ])

    const { GET } = await import('../route')
    const res = await GET()
    const json = await res.json()

    expect(json.properties).toEqual([])
  })

  it('returns 500 on API error', async () => {
    mockListAccountSummaries.mockRejectedValueOnce(new Error('GA4 API error'))

    const { GET } = await import('../route')
    const res = await GET()
    expect(res.status).toBe(500)
  })

  it('returns 401 when not authenticated', async () => {
    const { AuthError } = await import('@/lib/auth/api-guard')
    const { requireApiAuth } = await import('@/lib/auth/api-guard')
    vi.mocked(requireApiAuth).mockRejectedValueOnce(new AuthError('Unauthorized', 401))

    const { GET } = await import('../route')
    const res = await GET()
    expect(res.status).toBe(401)
  })
})
