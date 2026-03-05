import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthContext } from '@/tests/factories'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

// --- Mocks ---

const mockRequireApiAuth = vi.fn()
const mockRequireApiRole = vi.fn()
const mockSupabase = createMockSupabaseClient()

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

const { GET, PUT } = await import('../route')
const { AuthError } = await import('@/lib/auth/api-guard')

const defaultAuth = buildAuthContext()

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

const mockPostRow = {
  id: 'sp-1',
  platform: 'gbp',
  post_type: 'update',
  title: 'Spring Special',
  body: 'Check out our spring deals!',
  hashtags: [],
  cta_type: 'LEARN_MORE',
  cta_url: 'https://example.com',
  media_asset_id: null,
  status: 'review',
  keywords: ['painting'],
  metadata: {},
  published_at: null,
  created_at: '2026-03-05T12:00:00Z',
  updated_at: '2026-03-05T12:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  mockSupabase.from.mockReturnValue(mockSupabase)
  mockSupabase.select.mockReturnValue(mockSupabase)
  mockSupabase.insert.mockReturnValue(mockSupabase)
  mockSupabase.update.mockReturnValue(mockSupabase)
  mockSupabase.eq.mockReturnValue(mockSupabase)
  mockSupabase.returns.mockReturnValue(mockSupabase)
})

describe('GET /api/v1/social/[id]', () => {
  it('returns social post detail', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({ data: mockPostRow, error: null })

    const req = new Request('http://localhost/api/v1/social/sp-1')
    const res = await GET(req, makeParams('sp-1'))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.id).toBe('sp-1')
    expect(json.platform).toBe('gbp')
    expect(json.ctaType).toBe('LEARN_MORE')
  })

  it('returns 404 when post not found', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })

    const req = new Request('http://localhost/api/v1/social/missing')
    const res = await GET(req, makeParams('missing'))

    expect(res.status).toBe(404)
  })

  it('returns 401 when not authenticated', async () => {
    mockRequireApiAuth.mockRejectedValue(new AuthError('Unauthorized', 401))

    const req = new Request('http://localhost/api/v1/social/sp-1')
    const res = await GET(req, makeParams('sp-1'))

    expect(res.status).toBe(401)
  })
})

describe('PUT /api/v1/social/[id]', () => {
  it('updates social post body', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'sp-1', status: 'review' },
      error: null,
    })
    mockSupabase.update.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)

    // For the refetch after update
    mockSupabase.single.mockResolvedValueOnce({
      data: { ...mockPostRow, body: 'Updated body' },
      error: null,
    })

    const req = new Request('http://localhost/api/v1/social/sp-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: 'Updated body' }),
    })
    const res = await PUT(req, makeParams('sp-1'))

    expect(res.status).toBe(200)
  })

  it('returns 422 when post is published', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'sp-1', status: 'published' },
      error: null,
    })

    const req = new Request('http://localhost/api/v1/social/sp-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: 'New body' }),
    })
    const res = await PUT(req, makeParams('sp-1'))

    expect(res.status).toBe(422)
  })

  it('returns 400 for empty update', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)

    const req = new Request('http://localhost/api/v1/social/sp-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await PUT(req, makeParams('sp-1'))

    expect(res.status).toBe(400)
  })

  it('returns 404 when post not found', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })

    const req = new Request('http://localhost/api/v1/social/missing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: 'text' }),
    })
    const res = await PUT(req, makeParams('missing'))

    expect(res.status).toBe(404)
  })
})
