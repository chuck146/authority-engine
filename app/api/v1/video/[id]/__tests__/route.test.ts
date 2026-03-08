import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthContext } from '@/tests/factories'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

const mockRequireApiAuth = vi.fn()
const mockRequireApiRole = vi.fn()
const mockSupabase = createMockSupabaseClient()
const mockAdminSupabase = createMockSupabaseClient()

vi.mock('@/lib/auth/api-guard', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/auth/api-guard')>('@/lib/auth/api-guard')
  return {
    AuthError: actual.AuthError,
    requireApiAuth: (...args: unknown[]) => mockRequireApiAuth(...args),
    requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockAdminSupabase),
}))

const { GET, DELETE } = await import('../route')
const { AuthError } = await import('@/lib/auth/api-guard')

const defaultAuth = buildAuthContext()
const routeContext = { params: Promise.resolve({ id: 'video-1' }) }

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  mockSupabase.from.mockReturnValue(mockSupabase)
  mockSupabase.select.mockReturnValue(mockSupabase)
  mockSupabase.eq.mockReturnValue(mockSupabase)
  ;(mockSupabase as unknown as Record<string, unknown>).storage = {
    from: vi.fn(() => ({
      getPublicUrl: vi.fn(() => ({
        data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/media/' },
      })),
    })),
  }
  mockAdminSupabase.from.mockReturnValue(mockAdminSupabase)
  mockAdminSupabase.delete.mockReturnValue(mockAdminSupabase)
  mockAdminSupabase.eq.mockReturnValue(mockAdminSupabase)
  ;(mockAdminSupabase as unknown as Record<string, unknown>).storage = {
    from: vi.fn(() => ({ remove: vi.fn(() => Promise.resolve({ error: null })) })),
  }
})

describe('GET /api/v1/video/[id]', () => {
  it('returns video detail', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'video-1',
        filename: 'reel-living-room.mp4',
        storage_path: 'org-456/videos/cinematic_reel/abc.mp4',
        mime_type: 'video/mp4',
        size_bytes: 5242880,
        duration_seconds: 8,
        metadata: { videoType: 'cinematic_reel', model: 'veo-3.1-fast-generate-preview' },
        created_at: '2026-03-07T12:00:00Z',
      },
      error: null,
    })

    const req = new Request('http://localhost/api/v1/video/video-1')
    const res = await GET(req, routeContext)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.id).toBe('video-1')
    expect(json.videoType).toBe('cinematic_reel')
    expect(json.durationSeconds).toBe(8)
  })

  it('returns 404 when video not found', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })

    const req = new Request('http://localhost/api/v1/video/nonexistent')
    const res = await GET(req, routeContext)

    expect(res.status).toBe(404)
  })

  it('returns 401 when not authenticated', async () => {
    mockRequireApiAuth.mockRejectedValue(new AuthError('Unauthorized', 401))

    const req = new Request('http://localhost/api/v1/video/video-1')
    const res = await GET(req, routeContext)

    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/v1/video/[id]', () => {
  it('deletes video successfully', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: { storage_path: 'org-456/videos/cinematic_reel/abc.mp4' },
      error: null,
    })
    // Chain: admin.from().delete().eq(id).eq(org) — last eq resolves the query
    mockAdminSupabase.eq
      .mockReturnValueOnce(mockAdminSupabase) // first .eq('id', ...)
      .mockResolvedValueOnce({ error: null }) // second .eq('organization_id', ...)

    const req = new Request('http://localhost/api/v1/video/video-1', { method: 'DELETE' })
    const res = await DELETE(req, routeContext)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('returns 404 when video not found for delete', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: null })

    const req = new Request('http://localhost/api/v1/video/nonexistent', { method: 'DELETE' })
    const res = await DELETE(req, routeContext)

    expect(res.status).toBe(404)
  })

  it('returns 403 when insufficient role', async () => {
    mockRequireApiRole.mockRejectedValue(new AuthError('Insufficient permissions', 403))

    const req = new Request('http://localhost/api/v1/video/video-1', { method: 'DELETE' })
    const res = await DELETE(req, routeContext)

    expect(res.status).toBe(403)
  })
})
