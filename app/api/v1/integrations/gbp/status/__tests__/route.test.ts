import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'
import { buildAuthContext } from '@/tests/factories'

const mockAuth = buildAuthContext({ role: 'editor' })
const mockSupabase = createMockSupabaseClient()

vi.mock('@/lib/auth/api-guard', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/auth/api-guard')>()
  return {
    ...actual,
    requireApiAuth: vi.fn().mockResolvedValue(mockAuth),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

describe('GET /api/v1/integrations/gbp/status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
  })

  it('returns disconnected status when no connection exists', async () => {
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null })

    const { GET } = await import('../route')
    const res = await GET()
    const json = await res.json()

    expect(json.isConnected).toBe(false)
    expect(json.provider).toBe('business_profile')
    expect(json.locationName).toBeNull()
  })

  it('returns connected status with locationName', async () => {
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: {
        id: 'conn-1',
        provider: 'business_profile',
        site_url: 'locations/123456',
        status: 'active',
        last_synced_at: '2026-03-04T12:00:00Z',
        sync_error: null,
        created_at: '2026-03-01T12:00:00Z',
      },
      error: null,
    })

    const { GET } = await import('../route')
    const res = await GET()
    const json = await res.json()

    expect(json.isConnected).toBe(true)
    expect(json.provider).toBe('business_profile')
    expect(json.locationName).toBe('locations/123456')
    expect(json.lastSyncedAt).toBe('2026-03-04T12:00:00Z')
  })

  it('returns isConnected false when status is error', async () => {
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: {
        id: 'conn-1',
        provider: 'business_profile',
        site_url: 'locations/123456',
        status: 'error',
        last_synced_at: null,
        sync_error: 'Token expired',
        created_at: '2026-03-01T12:00:00Z',
      },
      error: null,
    })

    const { GET } = await import('../route')
    const res = await GET()
    const json = await res.json()

    expect(json.isConnected).toBe(false)
    expect(json.syncError).toBe('Token expired')
  })

  it('returns 401 when not authenticated', async () => {
    const { AuthError } = await import('@/lib/auth/api-guard')
    const { requireApiAuth } = await import('@/lib/auth/api-guard')
    vi.mocked(requireApiAuth).mockRejectedValueOnce(new AuthError('Unauthorized', 401))

    const { GET } = await import('../route')
    const res = await GET()
    expect(res.status).toBe(401)
  })
})
