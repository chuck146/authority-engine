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

const mockListAccounts = vi.fn()
const mockListLocations = vi.fn()
vi.mock('@/lib/google/business-profile', () => ({
  listAccounts: mockListAccounts,
  listLocations: mockListLocations,
}))

describe('GET /api/v1/integrations/gbp/locations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns locations from GBP API', async () => {
    mockListAccounts.mockResolvedValueOnce([
      { name: 'accounts/111', accountName: 'Cleanest Painting' },
    ])
    mockListLocations.mockResolvedValueOnce([
      {
        name: 'locations/222',
        title: 'Cleanest Painting - Summit',
        storefrontAddress: {
          addressLines: ['123 Main St'],
          locality: 'Summit',
          administrativeArea: 'NJ',
        },
      },
      {
        name: 'locations/333',
        title: 'Cleanest Painting - Westfield',
        storefrontAddress: {
          addressLines: ['456 Elm St'],
          locality: 'Westfield',
          administrativeArea: 'NJ',
        },
      },
    ])

    const { GET } = await import('../route')
    const res = await GET()
    const json = await res.json()

    expect(json.locations).toHaveLength(2)
    expect(json.locations[0]).toEqual({
      value: 'locations/222',
      label: 'Cleanest Painting - Summit',
      address: '123 Main St, Summit, NJ',
    })
    expect(json.locations[1]).toEqual({
      value: 'locations/333',
      label: 'Cleanest Painting - Westfield',
      address: '456 Elm St, Westfield, NJ',
    })
  })

  it('returns empty locations when no accounts', async () => {
    mockListAccounts.mockResolvedValueOnce([])

    const { GET } = await import('../route')
    const res = await GET()
    const json = await res.json()

    expect(json.locations).toEqual([])
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
