import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { buildAuthContext } from '@/tests/factories'

const mockAuth = buildAuthContext({ role: 'admin' })

vi.mock('@/lib/auth/api-guard', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/auth/api-guard')>()
  return {
    ...actual,
    requireApiAuth: vi.fn().mockResolvedValue(mockAuth),
  }
})

// Mock token manager to throw (no integrations connected)
vi.mock('@/lib/google/token-manager', () => ({
  getValidToken: vi.fn().mockRejectedValue(new Error('No connection')),
}))

// Mock supabase for keyword summary + connection check
const mockFrom = vi.fn().mockImplementation((table: string) => {
  if (table === 'google_connections') {
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }
  }
  // keyword_rankings
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
}))

describe('GET /api/v1/analytics/overview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns overview with disconnected integrations', async () => {
    const { GET } = await import('../route')
    const request = new NextRequest('http://localhost/api/v1/analytics/overview?range=28d')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ga4Connected).toBe(false)
    expect(body.gscConnected).toBe(false)
    expect(body.ga4).toBeNull()
    expect(body.gsc).toBeNull()
    expect(body.keywords).toBeDefined()
    expect(body.keywords.totalTracked).toBe(0)
  })

  it('accepts custom date range', async () => {
    const { GET } = await import('../route')
    const request = new NextRequest(
      'http://localhost/api/v1/analytics/overview?range=custom&startDate=2026-02-01&endDate=2026-02-28',
    )
    const response = await GET(request)

    expect(response.status).toBe(200)
  })

  it('returns 400 for invalid range', async () => {
    const { GET } = await import('../route')
    const request = new NextRequest('http://localhost/api/v1/analytics/overview?range=invalid')
    const response = await GET(request)

    expect(response.status).toBe(400)
  })

  it('returns 401 for unauthenticated requests', async () => {
    const { requireApiAuth, AuthError } = await import('@/lib/auth/api-guard')
    vi.mocked(requireApiAuth).mockRejectedValueOnce(new AuthError('Unauthorized', 401))

    const { GET } = await import('../route')
    const request = new NextRequest('http://localhost/api/v1/analytics/overview')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })
})
