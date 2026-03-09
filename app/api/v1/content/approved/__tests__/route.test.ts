import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock auth guard
vi.mock('@/lib/auth/api-guard', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/auth/api-guard')>()
  return {
    ...actual,
    requireApiAuth: vi.fn().mockResolvedValue({
      userId: 'user-123',
      organizationId: 'org-456',
      role: 'editor',
    }),
  }
})

// Mock Supabase
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockLike = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()
const mockReturns = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  }),
}))

describe('GET /api/v1/content/approved', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValueOnce({ eq: mockEq })
    mockEq.mockReturnValueOnce({ order: mockOrder })
    mockOrder.mockReturnValue({ limit: mockLimit })
    mockLimit.mockReturnValue({ returns: mockReturns })
  })

  it('returns approved content for service_page type', async () => {
    mockReturns.mockResolvedValue({
      data: [
        { id: 'sp-1', title: 'Interior Painting' },
        { id: 'sp-2', title: 'Exterior Painting' },
      ],
      error: null,
    })

    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost/api/v1/content/approved?type=service_page')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual([
      { id: 'sp-1', title: 'Interior Painting' },
      { id: 'sp-2', title: 'Exterior Painting' },
    ])
  })

  it('returns 400 for missing type parameter', async () => {
    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost/api/v1/content/approved')
    const res = await GET(req)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Invalid or missing type')
  })

  it('returns 400 for invalid type parameter', async () => {
    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost/api/v1/content/approved?type=invalid')
    const res = await GET(req)

    expect(res.status).toBe(400)
  })

  it('falls back to body slice for social posts with null title', async () => {
    const longBody =
      'Transform your home with our expert painting services! Free estimates available for spring.'
    mockReturns.mockResolvedValue({
      data: [{ id: 'social-1', title: null, body: longBody }],
      error: null,
    })

    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost/api/v1/content/approved?type=social_post')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    // Body is > 80 chars, so it gets sliced
    expect(data[0].title).toBe(longBody.slice(0, 80))
  })

  it('returns empty array when no approved content', async () => {
    mockReturns.mockResolvedValue({ data: [], error: null })

    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost/api/v1/content/approved?type=blog_post')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual([])
  })

  it('returns 401 when not authenticated', async () => {
    const { requireApiAuth } = await import('@/lib/auth/api-guard')
    const { AuthError } = await import('@/lib/auth/api-guard')
    vi.mocked(requireApiAuth).mockRejectedValueOnce(new AuthError('Unauthorized', 401))

    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost/api/v1/content/approved?type=service_page')
    const res = await GET(req)

    expect(res.status).toBe(401)
  })

  it('returns videos from media_assets for type=video', async () => {
    // Video path uses: select → eq(org) → like(mime) → order → limit → returns
    // Clear stale beforeEach chain setup
    mockEq.mockReset()
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValueOnce({ like: mockLike })
    mockLike.mockReturnValue({ order: mockOrder })
    mockOrder.mockReturnValue({ limit: mockLimit })
    mockLimit.mockReturnValue({ returns: mockReturns })
    mockReturns.mockResolvedValue({
      data: [
        { id: 'vid-1', filename: 'cinematic_reel-org-123.mp4' },
        { id: 'vid-2', filename: 'testimonial_quote-org-123.mp4' },
      ],
      error: null,
    })

    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost/api/v1/content/approved?type=video')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual([
      { id: 'vid-1', title: 'cinematic_reel-org-123.mp4' },
      { id: 'vid-2', title: 'testimonial_quote-org-123.mp4' },
    ])
  })

  it('returns empty array when no videos exist', async () => {
    mockEq.mockReset()
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValueOnce({ like: mockLike })
    mockLike.mockReturnValue({ order: mockOrder })
    mockOrder.mockReturnValue({ limit: mockLimit })
    mockLimit.mockReturnValue({ returns: mockReturns })
    mockReturns.mockResolvedValue({ data: [], error: null })

    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost/api/v1/content/approved?type=video')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual([])
  })
})
