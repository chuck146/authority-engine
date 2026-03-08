import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { buildAuthContext } from '@/tests/factories'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

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

function setupChain() {
  mockSupabase.from.mockReturnValue(mockSupabase)
  mockSupabase.select.mockReturnValue(mockSupabase)
  mockSupabase.eq.mockReturnValue(mockSupabase)
  mockSupabase.order.mockReturnValue(mockSupabase)
  ;(mockSupabase as unknown as Record<string, unknown>).storage = {
    from: vi.fn(() => ({
      getPublicUrl: vi.fn(() => ({
        data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/media/' },
      })),
    })),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  setupChain()
})

describe('GET /api/v1/video', () => {
  it('returns video library items', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)

    const mockData = [
      {
        id: 'video-1',
        filename: 'reel-living-room.mp4',
        storage_path: 'org-456/videos/cinematic_reel/abc.mp4',
        mime_type: 'video/mp4',
        size_bytes: 5242880,
        duration_seconds: 8,
        metadata: { videoType: 'cinematic_reel' },
        created_at: '2026-03-07T12:00:00Z',
      },
    ]

    // No filter, so order is terminal — resolve via order
    mockSupabase.order.mockResolvedValueOnce({ data: mockData, error: null })

    const req = new NextRequest('http://localhost/api/v1/video')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.items).toHaveLength(1)
    expect(json.items[0].videoType).toBe('cinematic_reel')
    expect(json.items[0].durationSeconds).toBe(8)
  })

  it('applies videoType filter when provided', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    // With filter: chain is eq(org).eq(type).order().eq(videoType)
    // eq calls: 1st returns chain, 2nd returns chain, order returns chain, 3rd eq resolves
    let eqCallCount = 0
    mockSupabase.eq.mockImplementation(() => {
      eqCallCount++
      if (eqCallCount <= 2) return mockSupabase // org_id and type
      return Promise.resolve({ data: [], error: null }) // videoType filter (terminal)
    })

    const req = new NextRequest('http://localhost/api/v1/video?videoType=project_showcase')
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(eqCallCount).toBe(3)
  })

  it('returns 401 when not authenticated', async () => {
    mockRequireApiAuth.mockRejectedValue(new AuthError('Unauthorized', 401))

    const req = new NextRequest('http://localhost/api/v1/video')
    const res = await GET(req)

    expect(res.status).toBe(401)
  })

  it('returns empty list when no videos', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.order.mockResolvedValueOnce({ data: [], error: null })

    const req = new NextRequest('http://localhost/api/v1/video')
    const res = await GET(req)

    const json = await res.json()
    expect(json.items).toHaveLength(0)
  })

  it('returns 500 on database error', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.order.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })

    const req = new NextRequest('http://localhost/api/v1/video')
    const res = await GET(req)

    expect(res.status).toBe(500)
  })
})
