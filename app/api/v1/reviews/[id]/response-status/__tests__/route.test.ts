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
  return new Request('http://localhost/api/v1/reviews/r-1/response-status', {
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

describe('PATCH /api/v1/reviews/[id]/response-status', () => {
  it('approves a response in review status', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'r-1', response_status: 'review' },
      error: null,
    })

    const res = await PATCH(makeRequest({ action: 'approve' }), makeParams('r-1'))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.responseStatus).toBe('approved')
    expect(json.action).toBe('approve')
  })

  it('marks an approved response as sent', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'r-1', response_status: 'approved' },
      error: null,
    })

    const res = await PATCH(makeRequest({ action: 'mark_sent' }), makeParams('r-1'))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.responseStatus).toBe('sent')
  })

  it('submits a draft for review', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'r-1', response_status: 'draft' },
      error: null,
    })

    const res = await PATCH(makeRequest({ action: 'submit_for_review' }), makeParams('r-1'))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.responseStatus).toBe('review')
  })

  it('rejects a response with a note', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'r-1', response_status: 'review' },
      error: null,
    })

    const res = await PATCH(
      makeRequest({ action: 'reject', rejectionNote: 'Needs revision' }),
      makeParams('r-1'),
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.responseStatus).toBe('draft')
  })

  it('archives a response', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'r-1', response_status: 'sent' },
      error: null,
    })

    const res = await PATCH(makeRequest({ action: 'archive' }), makeParams('r-1'))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.responseStatus).toBe('archived')
  })

  it('returns 422 for invalid status transition', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'r-1', response_status: 'pending' },
      error: null,
    })

    const res = await PATCH(makeRequest({ action: 'mark_sent' }), makeParams('r-1'))

    expect(res.status).toBe(422)
  })

  it('returns 404 when review not found', async () => {
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

    const res = await PATCH(makeRequest({ action: 'invalid_action' }), makeParams('r-1'))

    expect(res.status).toBe(400)
  })

  it('returns 400 for reject without note', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)

    const res = await PATCH(makeRequest({ action: 'reject' }), makeParams('r-1'))

    expect(res.status).toBe(400)
  })

  it('returns 401 when not authenticated', async () => {
    mockRequireApiRole.mockRejectedValue(new AuthError('Unauthorized', 401))

    const res = await PATCH(makeRequest({ action: 'approve' }), makeParams('r-1'))

    expect(res.status).toBe(401)
  })
})
