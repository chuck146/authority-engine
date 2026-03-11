import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthContext, buildGenerateVideoResponse } from '@/tests/factories'

const mockRequireApiAuth = vi.fn()
const mockGetCompositeJobStatus = vi.fn()
const mockGetVideoJobStatus = vi.fn()
const mockGetRemotionJobStatus = vi.fn()

vi.mock('@/lib/auth/api-guard', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/auth/api-guard')>('@/lib/auth/api-guard')
  return {
    AuthError: actual.AuthError,
    requireApiAuth: (...args: unknown[]) => mockRequireApiAuth(...args),
  }
})

vi.mock('@/lib/queue/composite-scheduler', () => ({
  getCompositeJobStatus: (...args: unknown[]) => mockGetCompositeJobStatus(...args),
}))

vi.mock('@/lib/queue/video-scheduler', () => ({
  getVideoJobStatus: (...args: unknown[]) => mockGetVideoJobStatus(...args),
}))

vi.mock('@/lib/queue/remotion-scheduler', () => ({
  getRemotionJobStatus: (...args: unknown[]) => mockGetRemotionJobStatus(...args),
}))

const { GET } =
  await import('@/app/api/v1/video/[id]/status/route')
const defaultAuth = buildAuthContext()

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  mockRequireApiAuth.mockResolvedValue(defaultAuth)
})

describe('GET /api/v1/video/[id]/status — composite jobs', () => {
  it('calls getCompositeJobStatus for composite- prefixed job IDs', async () => {
    mockGetCompositeJobStatus.mockResolvedValue({
      state: 'queued',
      progress: null,
      compositeStep: null,
    })

    const req = new Request('http://localhost/api/v1/video/composite-org-456-111/status')
    await GET(req, makeContext('composite-org-456-111'))

    expect(mockGetCompositeJobStatus).toHaveBeenCalledWith('composite-org-456-111')
    expect(mockGetVideoJobStatus).not.toHaveBeenCalled()
    expect(mockGetRemotionJobStatus).not.toHaveBeenCalled()
  })

  it('returns queued status for composite job', async () => {
    mockGetCompositeJobStatus.mockResolvedValue({
      state: 'queued',
      progress: null,
      compositeStep: null,
    })

    const req = new Request('http://localhost/api/v1/video/composite-org-456-111/status')
    const res = await GET(req, makeContext('composite-org-456-111'))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('queued')
    expect(json.progress).toBeNull()
    expect(json.compositeStep).toBeNull()
  })

  it('returns compositeStep data when processing', async () => {
    const compositeStep = {
      currentStep: 'veo' as const,
      stepLabel: 'Generating cinematic clip with Veo 3.1...',
      overallProgress: 45,
    }
    mockGetCompositeJobStatus.mockResolvedValue({
      state: 'processing',
      progress: 45,
      compositeStep,
    })

    const req = new Request('http://localhost/api/v1/video/composite-org-456-111/status')
    const res = await GET(req, makeContext('composite-org-456-111'))

    const json = await res.json()
    expect(json.status).toBe('processing')
    expect(json.progress).toBe(45)
    expect(json.compositeStep).toEqual(compositeStep)
    expect(json.compositeStep.currentStep).toBe('veo')
    expect(json.compositeStep.stepLabel).toBe('Generating cinematic clip with Veo 3.1...')
  })

  it('returns compositeStep for each pipeline step', async () => {
    const steps = ['intro', 'veo', 'outro', 'stitch', 'upload'] as const

    for (const step of steps) {
      mockGetCompositeJobStatus.mockResolvedValue({
        state: 'processing',
        progress: 20,
        compositeStep: {
          currentStep: step,
          stepLabel: `Rendering ${step}...`,
          overallProgress: 20,
        },
      })

      const req = new Request('http://localhost/api/v1/video/composite-org-456-111/status')
      const res = await GET(req, makeContext('composite-org-456-111'))
      const json = await res.json()

      expect(json.compositeStep.currentStep).toBe(step)
    }
  })

  it('returns completed status with result for composite job', async () => {
    const videoResult = buildGenerateVideoResponse({ videoType: 'composite_reel' as never })
    mockGetCompositeJobStatus.mockResolvedValue({
      state: 'completed',
      progress: 100,
      compositeStep: null,
      result: videoResult,
    })

    const req = new Request('http://localhost/api/v1/video/composite-org-456-111/status')
    const res = await GET(req, makeContext('composite-org-456-111'))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('completed')
    expect(json.result.id).toBe(videoResult.id)
  })

  it('returns failed status with error for composite job', async () => {
    mockGetCompositeJobStatus.mockResolvedValue({
      state: 'failed',
      progress: null,
      compositeStep: null,
      error: 'Veo API quota exceeded',
    })

    const req = new Request('http://localhost/api/v1/video/composite-org-456-111/status')
    const res = await GET(req, makeContext('composite-org-456-111'))

    const json = await res.json()
    expect(json.status).toBe('failed')
    expect(json.error).toBe('Veo API quota exceeded')
  })

  it('returns 404 when composite job not found', async () => {
    mockGetCompositeJobStatus.mockResolvedValue(null)

    const req = new Request('http://localhost/api/v1/video/composite-nonexistent/status')
    const res = await GET(req, makeContext('composite-nonexistent'))

    expect(res.status).toBe(404)
  })

  it('does not call getCompositeJobStatus for non-composite job IDs', async () => {
    mockGetVideoJobStatus.mockResolvedValue({
      state: 'queued',
      progress: null,
    })

    const req = new Request('http://localhost/api/v1/video/video-org-456-111/status')
    await GET(req, makeContext('video-org-456-111'))

    expect(mockGetCompositeJobStatus).not.toHaveBeenCalled()
  })
})
