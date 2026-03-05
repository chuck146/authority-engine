import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { buildAuthContext } from '@/tests/factories'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

// --- Mocks ---

const mockRequireApiAuth = vi.fn()
const mockSupabase = createMockSupabaseClient()

vi.mock('@/lib/auth/api-guard', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/auth/api-guard')>('@/lib/auth/api-guard')
  return {
    AuthError: actual.AuthError,
    requireApiAuth: (...args: unknown[]) => mockRequireApiAuth(...args),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

const { GET } = await import('../route')
const { AuthError } = await import('@/lib/auth/api-guard')

const defaultAuth = buildAuthContext()

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  mockSupabase.from.mockReturnValue(mockSupabase)
  mockSupabase.select.mockReturnValue(mockSupabase)
  mockSupabase.eq.mockReturnValue(mockSupabase)
  mockSupabase.order.mockReturnValue(mockSupabase)
  mockSupabase.returns.mockReturnValue(mockSupabase)
})

describe('GET /api/v1/social', () => {
  it('returns list of social posts', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.returns.mockResolvedValueOnce({
      data: [
        {
          id: 'sp-1',
          platform: 'gbp',
          post_type: 'update',
          title: 'Spring Special',
          body: 'Check out our spring deals!',
          hashtags: [],
          status: 'review',
          media_asset_id: null,
          created_at: '2026-03-05T12:00:00Z',
        },
        {
          id: 'sp-2',
          platform: 'instagram',
          post_type: 'update',
          title: null,
          body: 'Beautiful project reveal!',
          hashtags: ['painting', 'nj'],
          status: 'approved',
          media_asset_id: 'media-1',
          created_at: '2026-03-04T12:00:00Z',
        },
      ],
      error: null,
    })

    const req = new NextRequest('http://localhost/api/v1/social')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveLength(2)
    expect(json[0].platform).toBe('gbp')
    expect(json[1].platform).toBe('instagram')
    expect(json[1].hashtags).toEqual(['painting', 'nj'])
  })

  it('filters by platform query param', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.returns.mockResolvedValueOnce({ data: [], error: null })

    const req = new NextRequest('http://localhost/api/v1/social?platform=instagram')
    await GET(req)

    expect(mockSupabase.eq).toHaveBeenCalledWith('platform', 'instagram')
  })

  it('filters by status query param', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.returns.mockResolvedValueOnce({ data: [], error: null })

    const req = new NextRequest('http://localhost/api/v1/social?status=review')
    await GET(req)

    expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'review')
  })

  it('returns empty array when no posts', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.returns.mockResolvedValueOnce({ data: [], error: null })

    const req = new NextRequest('http://localhost/api/v1/social')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual([])
  })

  it('returns 401 when not authenticated', async () => {
    mockRequireApiAuth.mockRejectedValue(new AuthError('Unauthorized', 401))

    const req = new NextRequest('http://localhost/api/v1/social')
    const res = await GET(req)

    expect(res.status).toBe(401)
  })

  it('returns 500 on database error', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.returns.mockResolvedValueOnce({
      data: null,
      error: { message: 'DB error', code: '500' },
    })

    const req = new NextRequest('http://localhost/api/v1/social')
    const res = await GET(req)

    expect(res.status).toBe(500)
  })
})
