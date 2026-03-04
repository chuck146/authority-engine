import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthContext, buildStructuredContent } from '@/tests/factories'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

// --- Mocks ---

const mockRequireApiAuth = vi.fn()
const mockSupabase = createMockSupabaseClient()

vi.mock('@/lib/auth/api-guard', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth/api-guard')>('@/lib/auth/api-guard')
  return {
    AuthError: actual.AuthError,
    requireApiAuth: (...args: unknown[]) => mockRequireApiAuth(...args),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

vi.mock('@/lib/seo', () => ({
  calculateSeoScore: vi.fn(() => ({
    score: 72,
    rules: [],
    categoryScores: { 'meta-tags': 80, 'content-structure': 70, 'keyword-optimization': 60, readability: 80 },
    summary: 'Good foundation.',
  })),
}))

const { GET } = await import('../route')
const { AuthError } = await import('@/lib/auth/api-guard')

type RouteParams = { params: Promise<{ type: string; id: string }> }

function makeParams(type: string, id: string): [Request, RouteParams] {
  const request = new Request(`http://localhost/api/v1/seo/${type}/${id}`)
  return [request, { params: Promise.resolve({ type, id }) }]
}

const defaultAuth = buildAuthContext()
const defaultContent = buildStructuredContent()

function rewireChain() {
  mockSupabase.from.mockReturnValue(mockSupabase)
  mockSupabase.select.mockReturnValue(mockSupabase)
  mockSupabase.eq.mockReturnValue(mockSupabase)
  mockSupabase.returns.mockReturnValue(mockSupabase)
  mockSupabase.single.mockResolvedValue({ data: null, error: null })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  rewireChain()
})

describe('GET /api/v1/seo/[type]/[id]', () => {
  it('returns 200 with full score breakdown', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'sp-1', title: 'Interior Painting', content: defaultContent, keywords: ['painting'] },
      error: null,
    })

    const res = await GET(...makeParams('service_page', 'sp-1'))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.score).toBe(72)
    expect(json.summary).toBe('Good foundation.')
  })

  it('returns 400 for invalid content type', async () => {
    const res = await GET(...makeParams('invalid_type', 'sp-1'))
    expect(res.status).toBe(400)
  })

  it('returns 404 when content not found', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: null })

    const res = await GET(...makeParams('service_page', 'nonexistent'))
    expect(res.status).toBe(404)
  })

  it('returns 401 when not authenticated', async () => {
    mockRequireApiAuth.mockRejectedValue(new AuthError('Unauthorized', 401))

    const res = await GET(...makeParams('service_page', 'sp-1'))
    expect(res.status).toBe(401)
  })

  it('returns 500 on unexpected error', async () => {
    mockRequireApiAuth.mockRejectedValue(new Error('DB down'))

    const res = await GET(...makeParams('service_page', 'sp-1'))
    expect(res.status).toBe(500)
  })
})
