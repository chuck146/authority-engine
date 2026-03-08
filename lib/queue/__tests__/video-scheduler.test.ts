import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildOrgContext } from '@/tests/factories'

const mockAdd = vi.fn()
const mockGetJob = vi.fn()

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: mockAdd,
    getJob: mockGetJob,
  })),
}))

vi.mock('../connection', () => ({
  getRedisConnection: vi.fn(() => ({})),
}))

const { enqueueVideoJob, getVideoJobStatus } = await import('../video-scheduler')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('enqueueVideoJob', () => {
  it('adds job to video-generation queue', async () => {
    mockAdd.mockResolvedValue({ id: 'video-org-456-123' })

    const jobId = await enqueueVideoJob(
      'org-456',
      'user-123',
      {
        videoType: 'cinematic_reel',
        sceneDescription: 'A painted room',
        audioMood: 'Warm mood',
        aspectRatio: '9:16',
        model: 'veo-3.1-fast-generate-preview',
      },
      buildOrgContext(),
    )

    expect(jobId).toBe('video-org-456-123')
    expect(mockAdd).toHaveBeenCalledWith(
      'generate-video',
      expect.objectContaining({
        orgId: 'org-456',
        userId: 'user-123',
      }),
      expect.objectContaining({
        attempts: 2,
        removeOnComplete: false,
      }),
    )
  })

  it('uses exponential backoff retry', async () => {
    mockAdd.mockResolvedValue({ id: 'job-1' })

    await enqueueVideoJob(
      'org-456',
      'user-123',
      {
        videoType: 'brand_story',
        narrative: 'Our company story is one of dedication',
        style: 'cinematic',
        model: 'veo-3.1-fast-generate-preview',
      },
      buildOrgContext(),
    )

    const jobOptions = mockAdd.mock.calls[0]![2]
    expect(jobOptions.backoff).toEqual({
      type: 'exponential',
      delay: 10_000,
    })
  })
})

describe('getVideoJobStatus', () => {
  it('returns null when job not found', async () => {
    mockGetJob.mockResolvedValue(null)

    const result = await getVideoJobStatus('nonexistent')

    expect(result).toBeNull()
  })

  it('returns queued state for waiting job', async () => {
    mockGetJob.mockResolvedValue({
      getState: vi.fn().mockResolvedValue('waiting'),
      progress: 0,
      returnvalue: null,
      failedReason: null,
    })

    const result = await getVideoJobStatus('video-1')

    expect(result?.state).toBe('queued')
  })

  it('returns processing state for active job', async () => {
    mockGetJob.mockResolvedValue({
      getState: vi.fn().mockResolvedValue('active'),
      progress: 50,
      returnvalue: null,
      failedReason: null,
    })

    const result = await getVideoJobStatus('video-1')

    expect(result?.state).toBe('processing')
    expect(result?.progress).toBe(50)
  })

  it('returns completed state with result', async () => {
    const videoResult = { id: 'video-1', videoType: 'cinematic_reel' }
    mockGetJob.mockResolvedValue({
      getState: vi.fn().mockResolvedValue('completed'),
      progress: 100,
      returnvalue: videoResult,
      failedReason: null,
    })

    const result = await getVideoJobStatus('video-1')

    expect(result?.state).toBe('completed')
    expect(result?.result).toEqual(videoResult)
  })

  it('returns failed state with error', async () => {
    mockGetJob.mockResolvedValue({
      getState: vi.fn().mockResolvedValue('failed'),
      progress: 0,
      returnvalue: null,
      failedReason: 'Veo API timeout',
    })

    const result = await getVideoJobStatus('video-1')

    expect(result?.state).toBe('failed')
    expect(result?.error).toBe('Veo API timeout')
  })
})
