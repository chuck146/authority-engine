import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth/api-guard', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/auth/api-guard')>()
  return {
    ...actual,
    requireApiAuth: vi.fn().mockResolvedValue({ userId: 'user-123', organizationId: 'org-456' }),
  }
})

const mockGetPremiumJobStatus = vi.fn()
vi.mock('@/lib/queue/premium-scheduler', () => ({
  getPremiumJobStatus: mockGetPremiumJobStatus,
}))

vi.mock('@/lib/queue/composite-scheduler', () => ({
  getCompositeJobStatus: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/queue/video-scheduler', () => ({
  getVideoJobStatus: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/queue/remotion-scheduler', () => ({
  getRemotionJobStatus: vi.fn().mockResolvedValue(null),
}))

describe('GET /api/v1/video/[id]/status — premium', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  async function callRoute(jobId: string) {
    const { GET } = await import('@/app/api/v1/video/[id]/status/route')
    return GET(new Request(`http://localhost/api/v1/video/${jobId}/status`), {
      params: Promise.resolve({ id: jobId }),
    })
  }

  it('routes premium- prefix to premium queue', async () => {
    mockGetPremiumJobStatus.mockResolvedValue({
      state: 'processing',
      progress: 45,
      premiumStep: {
        currentStep: 'scenes',
        stepLabel: 'Rendering cinematic scenes...',
        overallProgress: 45,
        sceneProgress: { currentScene: 2, totalScenes: 3 },
      },
    })

    const res = await callRoute('premium-org-456-1709820000000')
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.jobId).toBe('premium-org-456-1709820000000')
    expect(data.status).toBe('processing')
    expect(data.progress).toBe(45)
    expect(data.premiumStep).toEqual({
      currentStep: 'scenes',
      stepLabel: 'Rendering cinematic scenes...',
      overallProgress: 45,
      sceneProgress: { currentScene: 2, totalScenes: 3 },
    })
  })

  it('returns 404 when premium job not found', async () => {
    mockGetPremiumJobStatus.mockResolvedValue(null)

    const res = await callRoute('premium-org-456-999')

    expect(res.status).toBe(404)
  })

  it('returns completed state with result', async () => {
    mockGetPremiumJobStatus.mockResolvedValue({
      state: 'completed',
      progress: 100,
      premiumStep: {
        currentStep: 'upload',
        stepLabel: 'Uploading final video...',
        overallProgress: 100,
      },
      result: {
        id: 'video-1',
        videoType: 'premium_reel',
        filename: 'premium-reel-123.mp4',
        storagePath: 'org-456/videos/premium_reel/abc.mp4',
        publicUrl: 'https://example.com/abc.mp4',
        mimeType: 'video/mp4',
        sizeBytes: 10485760,
        durationSeconds: 30,
      },
    })

    const res = await callRoute('premium-org-456-1709820000000')
    const data = await res.json()

    expect(data.status).toBe('completed')
    expect(data.result.videoType).toBe('premium_reel')
  })

  it('returns failed state with error', async () => {
    mockGetPremiumJobStatus.mockResolvedValue({
      state: 'failed',
      progress: 40,
      premiumStep: {
        currentStep: 'scenes',
        stepLabel: 'Rendering cinematic scenes...',
        overallProgress: 40,
      },
      error: 'Scene 2 generation failed',
    })

    const res = await callRoute('premium-org-456-1709820000000')
    const data = await res.json()

    expect(data.status).toBe('failed')
    expect(data.error).toBe('Scene 2 generation failed')
  })
})
