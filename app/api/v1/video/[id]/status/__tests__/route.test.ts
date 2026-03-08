import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthContext, buildGenerateVideoResponse } from '@/tests/factories'

const mockRequireApiAuth = vi.fn()
const mockGetVideoJobStatus = vi.fn()

vi.mock('@/lib/auth/api-guard', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/auth/api-guard')>('@/lib/auth/api-guard')
  return {
    AuthError: actual.AuthError,
    requireApiAuth: (...args: unknown[]) => mockRequireApiAuth(...args),
  }
})

const mockGetRemotionJobStatus = vi.fn()

vi.mock('@/lib/queue/video-scheduler', () => ({
  getVideoJobStatus: (...args: unknown[]) => mockGetVideoJobStatus(...args),
}))

vi.mock('@/lib/queue/remotion-scheduler', () => ({
  getRemotionJobStatus: (...args: unknown[]) => mockGetRemotionJobStatus(...args),
}))

const { GET } = await import('../route')
const { AuthError } = await import('@/lib/auth/api-guard')

const defaultAuth = buildAuthContext()
const routeContext = { params: Promise.resolve({ id: 'video-org-456-1709820000000' }) }

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('GET /api/v1/video/[id]/status', () => {
  it('returns queued status', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockGetVideoJobStatus.mockResolvedValue({
      state: 'queued',
      progress: null,
    })

    const req = new Request('http://localhost/api/v1/video/job-1/status')
    const res = await GET(req, routeContext)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('queued')
    expect(json.progress).toBeNull()
  })

  it('returns processing status with progress', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockGetVideoJobStatus.mockResolvedValue({
      state: 'processing',
      progress: 50,
    })

    const req = new Request('http://localhost/api/v1/video/job-1/status')
    const res = await GET(req, routeContext)

    const json = await res.json()
    expect(json.status).toBe('processing')
    expect(json.progress).toBe(50)
  })

  it('returns completed status with result', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    const videoResult = buildGenerateVideoResponse()
    mockGetVideoJobStatus.mockResolvedValue({
      state: 'completed',
      progress: 100,
      result: videoResult,
    })

    const req = new Request('http://localhost/api/v1/video/job-1/status')
    const res = await GET(req, routeContext)

    const json = await res.json()
    expect(json.status).toBe('completed')
    expect(json.result.id).toBe(videoResult.id)
  })

  it('returns failed status with error', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockGetVideoJobStatus.mockResolvedValue({
      state: 'failed',
      progress: null,
      error: 'Veo API rate limit exceeded',
    })

    const req = new Request('http://localhost/api/v1/video/job-1/status')
    const res = await GET(req, routeContext)

    const json = await res.json()
    expect(json.status).toBe('failed')
    expect(json.error).toBe('Veo API rate limit exceeded')
  })

  it('returns 404 when job not found', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockGetVideoJobStatus.mockResolvedValue(null)
    mockGetRemotionJobStatus.mockResolvedValue(null)

    const req = new Request('http://localhost/api/v1/video/nonexistent/status')
    const res = await GET(req, routeContext)

    expect(res.status).toBe(404)
  })

  it('returns 401 when not authenticated', async () => {
    mockRequireApiAuth.mockRejectedValue(new AuthError('Unauthorized', 401))

    const req = new Request('http://localhost/api/v1/video/job-1/status')
    const res = await GET(req, routeContext)

    expect(res.status).toBe(401)
  })
})
