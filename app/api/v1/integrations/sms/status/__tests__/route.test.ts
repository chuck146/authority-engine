import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthContext } from '@/tests/factories'

// --- Mocks ---

const mockRequireApiAuth = vi.fn()

vi.mock('@/lib/auth/api-guard', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/auth/api-guard')>('@/lib/auth/api-guard')
  return {
    AuthError: actual.AuthError,
    requireApiAuth: (...args: unknown[]) => mockRequireApiAuth(...args),
  }
})

const { GET } = await import('../route')
const { AuthError } = await import('@/lib/auth/api-guard')

const defaultAuth = buildAuthContext()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/v1/integrations/sms/status', () => {
  it('returns configured when env vars present', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    vi.stubEnv('SALESMESSAGE_API_KEY', 'key-1')
    vi.stubEnv('SALESMESSAGE_NUMBER_ID', 'num-1')
    vi.stubEnv('SALESMESSAGE_TEAM_ID', 'team-1')

    const res = await GET()

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.isConfigured).toBe(true)
    expect(json.provider).toBe('salesmessage')

    vi.unstubAllEnvs()
  })

  it('returns not configured when env vars missing', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    vi.stubEnv('SALESMESSAGE_API_KEY', '')
    vi.stubEnv('SALESMESSAGE_NUMBER_ID', '')
    vi.stubEnv('SALESMESSAGE_TEAM_ID', '')

    const res = await GET()

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.isConfigured).toBe(false)

    vi.unstubAllEnvs()
  })

  it('returns 401 when not authenticated', async () => {
    mockRequireApiAuth.mockRejectedValue(new AuthError('Unauthorized', 401))

    const res = await GET()

    expect(res.status).toBe(401)
  })
})
