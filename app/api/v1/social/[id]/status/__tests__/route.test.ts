import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthContext } from '@/tests/factories'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

// --- Mocks ---

const mockRequireApiRole = vi.fn()
const mockSupabase = createMockSupabaseClient()

vi.mock('@/lib/auth/api-guard', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/auth/api-guard')>('@/lib/auth/api-guard')
  return {
    AuthError: actual.AuthError,
    requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

const { PATCH } = await import('../route')
const { AuthError } = await import('@/lib/auth/api-guard')

const defaultAuth = buildAuthContext({ role: 'admin' })

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/v1/social/sp-1/status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  mockSupabase.from.mockReturnValue(mockSupabase)
  mockSupabase.select.mockReturnValue(mockSupabase)
  mockSupabase.update.mockReturnValue(mockSupabase)
  mockSupabase.eq.mockReturnValue(mockSupabase)
  mockSupabase.returns.mockReturnValue(mockSupabase)
})

describe('PATCH /api/v1/social/[id]/status', () => {
  it('approves a post in review status', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'sp-1', status: 'review' },
      error: null,
    })
    // update returns chain, no error
    mockSupabase.eq.mockReturnValue(mockSupabase)

    const res = await PATCH(makeRequest({ action: 'approve' }), makeParams('sp-1'))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('approved')
    expect(json.action).toBe('approve')
  })

  it('publishes an approved post', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'sp-1', status: 'approved' },
      error: null,
    })

    const res = await PATCH(makeRequest({ action: 'publish' }), makeParams('sp-1'))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('published')
  })

  it('rejects a post with a note', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'sp-1', status: 'review' },
      error: null,
    })

    const res = await PATCH(
      makeRequest({ action: 'reject', rejectionNote: 'Needs revision' }),
      makeParams('sp-1'),
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('draft')
  })

  it('returns 422 for invalid status transition', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'sp-1', status: 'draft' },
      error: null,
    })

    const res = await PATCH(makeRequest({ action: 'publish' }), makeParams('sp-1'))

    expect(res.status).toBe(422)
  })

  it('returns 404 when post not found', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'not found' },
    })

    const res = await PATCH(makeRequest({ action: 'approve' }), makeParams('missing'))

    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid action', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)

    const res = await PATCH(makeRequest({ action: 'invalid_action' }), makeParams('sp-1'))

    expect(res.status).toBe(400)
  })

  it('returns 400 for reject without note', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)

    const res = await PATCH(makeRequest({ action: 'reject' }), makeParams('sp-1'))

    expect(res.status).toBe(400)
  })

  it('returns 401 when not authenticated', async () => {
    mockRequireApiRole.mockRejectedValue(new AuthError('Unauthorized', 401))

    const res = await PATCH(makeRequest({ action: 'approve' }), makeParams('sp-1'))

    expect(res.status).toBe(401)
  })

  it('returns 403 when insufficient role', async () => {
    mockRequireApiRole.mockRejectedValue(new AuthError('Insufficient permissions', 403))

    const res = await PATCH(makeRequest({ action: 'approve' }), makeParams('sp-1'))

    expect(res.status).toBe(403)
  })
})
