import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { buildAuthContext, buildContentPerformanceItem } from '@/tests/factories'

const mockAuth = buildAuthContext({ role: 'admin' })

vi.mock('@/lib/auth/api-guard', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/auth/api-guard')>()
  return {
    ...actual,
    requireApiAuth: vi.fn().mockResolvedValue(mockAuth),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({}),
}))

const mockGetContentPerformance = vi.fn()

vi.mock('@/lib/analytics/content-performance', () => ({
  getContentPerformance: mockGetContentPerformance,
}))

describe('GET /api/v1/analytics/content-performance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns paginated content performance data', async () => {
    const item = buildContentPerformanceItem()
    mockGetContentPerformance.mockResolvedValue({
      items: [item],
      total: 1,
      page: 1,
      pageSize: 25,
    })

    const { GET } = await import('../route')
    const request = new NextRequest(
      'http://localhost/api/v1/analytics/content-performance?range=28d',
    )
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.items).toHaveLength(1)
    expect(body.items[0].title).toBe('Interior Painting Services')
    expect(body.total).toBe(1)
  })

  it('passes content type filter to service', async () => {
    mockGetContentPerformance.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 25,
    })

    const { GET } = await import('../route')
    const request = new NextRequest(
      'http://localhost/api/v1/analytics/content-performance?range=28d&type=blog_post',
    )
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockGetContentPerformance).toHaveBeenCalledWith(
      expect.anything(),
      mockAuth.organizationId,
      expect.objectContaining({ startDate: expect.any(String) }),
      expect.objectContaining({ type: 'blog_post' }),
    )
  })

  it('passes search filter to service', async () => {
    mockGetContentPerformance.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 25,
    })

    const { GET } = await import('../route')
    const request = new NextRequest(
      'http://localhost/api/v1/analytics/content-performance?range=28d&search=painting',
    )
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockGetContentPerformance).toHaveBeenCalledWith(
      expect.anything(),
      mockAuth.organizationId,
      expect.objectContaining({ startDate: expect.any(String) }),
      expect.objectContaining({ search: 'painting' }),
    )
  })

  it('passes sort and order to service', async () => {
    mockGetContentPerformance.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 25,
    })

    const { GET } = await import('../route')
    const request = new NextRequest(
      'http://localhost/api/v1/analytics/content-performance?range=28d&sort=seoScore&order=asc',
    )
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockGetContentPerformance).toHaveBeenCalledWith(
      expect.anything(),
      mockAuth.organizationId,
      expect.objectContaining({ startDate: expect.any(String) }),
      expect.objectContaining({ sort: 'seoScore', order: 'asc' }),
    )
  })

  it('returns 400 for invalid query params', async () => {
    const { GET } = await import('../route')
    const request = new NextRequest(
      'http://localhost/api/v1/analytics/content-performance?range=invalid',
    )
    const response = await GET(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Invalid query parameters')
  })

  it('returns 401 for unauthenticated requests', async () => {
    const { requireApiAuth } = await import('@/lib/auth/api-guard')
    const { AuthError } = await import('@/lib/auth/api-guard')
    vi.mocked(requireApiAuth).mockRejectedValueOnce(new AuthError('Unauthorized', 401))

    const { GET } = await import('../route')
    const request = new NextRequest('http://localhost/api/v1/analytics/content-performance')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('returns 500 on service error', async () => {
    mockGetContentPerformance.mockRejectedValue(new Error('DB connection failed'))

    const { GET } = await import('../route')
    const request = new NextRequest(
      'http://localhost/api/v1/analytics/content-performance?range=28d',
    )
    const response = await GET(request)

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('Failed to fetch content performance')
  })

  it('handles custom date range params', async () => {
    mockGetContentPerformance.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 25,
    })

    const { GET } = await import('../route')
    const request = new NextRequest(
      'http://localhost/api/v1/analytics/content-performance?range=custom&startDate=2026-01-01&endDate=2026-01-31',
    )
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockGetContentPerformance).toHaveBeenCalledWith(
      expect.anything(),
      mockAuth.organizationId,
      expect.objectContaining({
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      }),
      expect.anything(),
    )
  })
})
