import { describe, it, expect, vi, beforeEach } from 'vitest'
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

// --- Helpers ---

function makeRequest(query = ''): Request {
  return new Request(`http://localhost/api/v1/media${query}`)
}

const defaultAuth = buildAuthContext()

const mockStorageFrom = vi.fn().mockReturnValue({
  getPublicUrl: vi.fn().mockReturnValue({
    data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/media/' },
  }),
})

// --- Setup ---

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  mockSupabase.from.mockReturnValue(mockSupabase)
  mockSupabase.select.mockReturnValue(mockSupabase)
  mockSupabase.eq.mockReturnValue(mockSupabase)
  mockSupabase.order.mockReturnValue(mockSupabase)
  // Add storage mock
  ;(mockSupabase as Record<string, unknown>).storage = { from: mockStorageFrom }
})

// --- Tests ---

describe('GET /api/v1/media', () => {
  it('returns items on success', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.order.mockResolvedValueOnce({
      data: [
        {
          id: 'media-1',
          filename: 'blog-test.png',
          storage_path: 'org-456/images/blog_thumbnail/abc.png',
          mime_type: 'image/png',
          size_bytes: 102400,
          width: 1200,
          height: 630,
          alt_text: 'Test image',
          metadata: { imageType: 'blog_thumbnail' },
          created_at: '2026-03-04T12:00:00Z',
        },
      ],
      error: null,
    })

    const res = await GET(makeRequest())

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.items).toHaveLength(1)
    expect(json.items[0].id).toBe('media-1')
    expect(json.items[0].imageType).toBe('blog_thumbnail')
    expect(json.items[0].publicUrl).toContain('org-456/images/blog_thumbnail/abc.png')
  })

  it('returns empty array when no media exists', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.order.mockResolvedValueOnce({ data: [], error: null })

    const res = await GET(makeRequest())

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.items).toEqual([])
  })

  it('returns 401 when not authenticated', async () => {
    mockRequireApiAuth.mockRejectedValue(new AuthError('Unauthorized', 401))

    const res = await GET(makeRequest())

    expect(res.status).toBe(401)
  })

  it('returns 500 on database error', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.order.mockResolvedValueOnce({
      data: null,
      error: { message: 'DB error' },
    })

    const res = await GET(makeRequest())

    expect(res.status).toBe(500)
  })
})
