import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

const mockRequireApiRole = vi.fn()
vi.mock('@/lib/auth/api-guard', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/auth/api-guard')>()
  return { ...actual, requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args) }
})

const mockSupabase = createMockSupabaseClient()
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

const mockRevalidateMarketingSite = vi.fn()
vi.mock('@/lib/marketing/revalidate', () => ({
  revalidateMarketingSite: () => mockRevalidateMarketingSite(),
}))

type DbError = { message: string; code?: string } | null

// The route reads the row (.select().eq().eq().returns().single()) and then
// updates it (.update().eq().eq() awaited). The final eq of the update chain
// resolves to the update result.
function setupDb(currentStatus: string | null, updateError: DbError = null) {
  mockSupabase.single.mockResolvedValueOnce(
    currentStatus
      ? { data: { id: 'content-1', status: currentStatus }, error: null }
      : { data: null, error: { message: 'not found' } },
  )
  let inUpdate = false
  let updateEqCalls = 0
  mockSupabase.update.mockImplementation(() => {
    inUpdate = true
    return mockSupabase
  })
  mockSupabase.eq.mockImplementation(() => {
    if (!inUpdate) return mockSupabase
    updateEqCalls++
    return updateEqCalls >= 2 ? Promise.resolve({ error: updateError }) : mockSupabase
  })
}

async function callPatch(body: unknown, type = 'service_page', id = 'content-1') {
  const { PATCH } = await import('@/app/api/v1/content/[type]/[id]/status/route')
  const request = new Request(`http://localhost/api/v1/content/${type}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return PATCH(request, { params: Promise.resolve({ type, id }) })
}

function updatePayload(): Record<string, unknown> {
  return mockSupabase.update.mock.calls[0]?.[0] as Record<string, unknown>
}

describe('PATCH /api/v1/content/[type]/[id]/status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.returns.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.update.mockReturnValue(mockSupabase)
    mockRequireApiRole.mockResolvedValue({
      userId: 'user-1',
      organizationId: 'org-1',
      role: 'admin',
    })
  })

  it('returns 401 when not authenticated', async () => {
    const { AuthError } = await import('@/lib/auth/api-guard')
    mockRequireApiRole.mockRejectedValueOnce(new AuthError('Unauthorized', 401))
    const res = await callPatch({ action: 'publish' })
    expect(res.status).toBe(401)
    expect(mockSupabase.update).not.toHaveBeenCalled()
    expect(mockRevalidateMarketingSite).not.toHaveBeenCalled()
  })

  it('returns 403 when the role is insufficient, requiring admin', async () => {
    const { AuthError } = await import('@/lib/auth/api-guard')
    mockRequireApiRole.mockRejectedValueOnce(new AuthError('Forbidden', 403))
    const res = await callPatch({ action: 'approve' })
    expect(res.status).toBe(403)
    expect(mockRequireApiRole).toHaveBeenCalledWith('admin')
    expect(mockSupabase.update).not.toHaveBeenCalled()
  })

  it('returns 400 for an unknown action', async () => {
    const res = await callPatch({ action: 'delete' })
    expect(res.status).toBe(400)
    expect(mockRequireApiRole).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid content type', async () => {
    const res = await callPatch({ action: 'publish' }, 'podcast')
    expect(res.status).toBe(400)
  })

  it('returns 400 when rejecting without a note', async () => {
    const res = await callPatch({ action: 'reject' })
    expect(res.status).toBe(400)
  })

  it('returns 404 when the content does not exist in the org', async () => {
    setupDb(null)
    const res = await callPatch({ action: 'publish' })
    expect(res.status).toBe(404)
    expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', 'org-1')
  })

  it('returns 422 for an invalid transition (publish from review)', async () => {
    setupDb('review')
    const res = await callPatch({ action: 'publish' })
    expect(res.status).toBe(422)
    expect(mockSupabase.update).not.toHaveBeenCalled()
    expect(mockRevalidateMarketingSite).not.toHaveBeenCalled()
  })

  it('publishes approved content and revalidates the marketing site', async () => {
    setupDb('approved')
    const res = await callPatch({ action: 'publish' }, 'location_page')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      id: 'content-1',
      type: 'location_page',
      status: 'published',
      action: 'publish',
    })
    expect(mockSupabase.from).toHaveBeenCalledWith('location_pages')
    expect(updatePayload()).toMatchObject({ status: 'published' })
    expect(updatePayload().published_at).toEqual(expect.any(String))
    expect(mockRevalidateMarketingSite).toHaveBeenCalledOnce()
  })

  it('revalidates when archiving published content (unpublish)', async () => {
    setupDb('published')
    const res = await callPatch({ action: 'archive' }, 'blog_post')

    expect(res.status).toBe(200)
    expect(mockSupabase.from).toHaveBeenCalledWith('blog_posts')
    expect(updatePayload()).toEqual({ status: 'archived' })
    expect(mockRevalidateMarketingSite).toHaveBeenCalledOnce()
  })

  it('does not revalidate when archiving content that was never public', async () => {
    setupDb('approved')
    const res = await callPatch({ action: 'archive' })
    expect(res.status).toBe(200)
    expect(mockRevalidateMarketingSite).not.toHaveBeenCalled()
  })

  it('approves review content without revalidating', async () => {
    setupDb('review')
    const res = await callPatch({ action: 'approve' })

    expect(res.status).toBe(200)
    expect(updatePayload()).toMatchObject({
      status: 'approved',
      approved_by: 'user-1',
      rejection_note: null,
    })
    expect(mockRevalidateMarketingSite).not.toHaveBeenCalled()
  })

  it('stores the rejection note and clears approval on reject', async () => {
    setupDb('review')
    const res = await callPatch({ action: 'reject', rejectionNote: 'Fix the intro' })

    expect(res.status).toBe(200)
    expect(updatePayload()).toEqual({
      status: 'draft',
      rejection_note: 'Fix the intro',
      approved_by: null,
      approved_at: null,
    })
    expect(mockRevalidateMarketingSite).not.toHaveBeenCalled()
  })

  it('returns 500 and does not revalidate when the update fails', async () => {
    setupDb('approved', { message: 'update failed' })
    const res = await callPatch({ action: 'publish' })

    expect(res.status).toBe(500)
    expect(mockSupabase.update).toHaveBeenCalled()
    expect(mockRevalidateMarketingSite).not.toHaveBeenCalled()
  })

  it('scopes the update to the organization', async () => {
    setupDb('approved')
    await callPatch({ action: 'publish' })
    const eqArgs = mockSupabase.eq.mock.calls.map((c: unknown[]) => c.join('='))
    // fetch + update both filter by id and organization_id
    expect(eqArgs.filter((a: string) => a === 'organization_id=org-1')).toHaveLength(2)
    expect(eqArgs.filter((a: string) => a === 'id=content-1')).toHaveLength(2)
  })
})
