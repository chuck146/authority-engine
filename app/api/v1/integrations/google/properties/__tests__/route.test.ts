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
  getValidToken: vi.fn().mockResolvedValue({ accessToken: 'ya29.test', siteUrl: 'https://example.com' }),
}))

const mockListSites = vi.fn()
vi.mock('@/lib/google/search-console', () => ({
  listSites: mockListSites,
}))

describe('GET /api/v1/integrations/google/properties', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns list of GSC properties', async () => {
    mockListSites.mockResolvedValueOnce([
      { siteUrl: 'https://example.com', permissionLevel: 'siteOwner' },
      { siteUrl: 'sc-domain:example.com', permissionLevel: 'siteOwner' },
    ])

    const { GET } = await import('../route')
    const res = await GET()
    const json = await res.json()

    expect(json.properties).toHaveLength(2)
    expect(json.properties[0].siteUrl).toBe('https://example.com')
  })

  it('returns empty array when no properties', async () => {
    mockListSites.mockResolvedValueOnce([])

    const { GET } = await import('../route')
    const res = await GET()
    const json = await res.json()

    expect(json.properties).toEqual([])
  })

  it('returns 500 on GSC API error', async () => {
    mockListSites.mockRejectedValueOnce(new Error('GSC API error'))

    const { GET } = await import('../route')
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
