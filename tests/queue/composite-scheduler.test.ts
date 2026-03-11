import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildCompositeJobData, buildGenerateVideoResponse } from '@/tests/factories'

const mockAdd = vi.fn()
const mockGetJob = vi.fn()

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: mockAdd,
    getJob: mockGetJob,
  })),
}))

vi.mock('@/lib/queue/connection', () => ({
  getRedisConnection: vi.fn(() => ({})),
}))

const { enqueueCompositeJob, getCompositeJobStatus } =
  await import('@/lib/queue/composite-scheduler')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('enqueueCompositeJob', () => {
  it('adds job to composite-rendering queue and returns job ID', async () => {
    mockAdd.mockResolvedValue({ id: 'composite-org-456-1709820000000' })

    const jobId = await enqueueCompositeJob(buildCompositeJobData())

    expect(jobId).toBe('composite-org-456-1709820000000')
    expect(mockAdd).toHaveBeenCalledWith(
      'render-composite',
      expect.objectContaining({
        orgId: 'org-456',
        userId: 'user-123',
      }),
      expect.objectContaining({
        attempts: 2,
        removeOnComplete: false,
        removeOnFail: false,
      }),
    )
  })

  it('uses composite- prefix in jobId option', async () => {
    mockAdd.mockResolvedValue({ id: 'composite-org-456-111' })

    await enqueueCompositeJob(buildCompositeJobData())

    const jobOptions = mockAdd.mock.calls[0]![2]
    expect(jobOptions.jobId).toMatch(/^composite-org-456-/)
  })

  it('uses exponential backoff', async () => {
    mockAdd.mockResolvedValue({ id: 'composite-org-456-111' })

    await enqueueCompositeJob(buildCompositeJobData())

    const jobOptions = mockAdd.mock.calls[0]![2]
    expect(jobOptions.backoff).toEqual({
      type: 'exponential',
      delay: 15_000,
    })
  })

  it('falls back to generated ID when job.id is undefined', async () => {
    mockAdd.mockResolvedValue({ id: undefined })

    const jobId = await enqueueCompositeJob(buildCompositeJobData())

    expect(jobId).toMatch(/^composite-org-456-/)
  })

  it('passes all composite job data fields', async () => {
    mockAdd.mockResolvedValue({ id: 'composite-org-456-111' })
    const data = buildCompositeJobData()

    await enqueueCompositeJob(data)

    const [, jobData] = mockAdd.mock.calls[0]!
    expect(jobData.sceneDescription).toBe(data.sceneDescription)
    expect(jobData.audioMood).toBe(data.audioMood)
    expect(jobData.includeIntro).toBe(true)
    expect(jobData.includeOutro).toBe(true)
    expect(jobData.useStartingFrame).toBe(true)
    expect(jobData.ctaText).toBe('Get Your Free Estimate')
    expect(jobData.orgContext.orgName).toBe('Cleanest Painting LLC')
  })
})

describe('getCompositeJobStatus', () => {
  it('returns null when job not found', async () => {
    mockGetJob.mockResolvedValue(null)

    const result = await getCompositeJobStatus('composite-nonexistent')

    expect(result).toBeNull()
  })

  it('returns queued state for waiting job', async () => {
    mockGetJob.mockResolvedValue({
      getState: vi.fn().mockResolvedValue('waiting'),
      progress: 0,
      returnvalue: null,
      failedReason: null,
    })

    const result = await getCompositeJobStatus('composite-org-456-111')

    expect(result?.state).toBe('queued')
    expect(result?.compositeStep).toBeNull()
  })

  it('returns queued state for delayed job', async () => {
    mockGetJob.mockResolvedValue({
      getState: vi.fn().mockResolvedValue('delayed'),
      progress: 0,
      returnvalue: null,
      failedReason: null,
    })

    const result = await getCompositeJobStatus('composite-org-456-111')

    expect(result?.state).toBe('queued')
  })

  it('returns processing state with compositeStep when progress is an object', async () => {
    const compositeStep = {
      currentStep: 'veo',
      stepLabel: 'Generating cinematic clip...',
      overallProgress: 40,
    }
    mockGetJob.mockResolvedValue({
      getState: vi.fn().mockResolvedValue('active'),
      progress: compositeStep,
      returnvalue: null,
      failedReason: null,
    })

    const result = await getCompositeJobStatus('composite-org-456-111')

    expect(result?.state).toBe('processing')
    expect(result?.compositeStep).toEqual(compositeStep)
    expect(result?.progress).toBe(40)
  })

  it('returns numeric progress when progress is a number', async () => {
    mockGetJob.mockResolvedValue({
      getState: vi.fn().mockResolvedValue('active'),
      progress: 60,
      returnvalue: null,
      failedReason: null,
    })

    const result = await getCompositeJobStatus('composite-org-456-111')

    expect(result?.state).toBe('processing')
    expect(result?.progress).toBe(60)
    expect(result?.compositeStep).toBeNull()
  })

  it('returns completed state with video result', async () => {
    const videoResult = buildGenerateVideoResponse()
    mockGetJob.mockResolvedValue({
      getState: vi.fn().mockResolvedValue('completed'),
      progress: 100,
      returnvalue: videoResult,
      failedReason: null,
    })

    const result = await getCompositeJobStatus('composite-org-456-111')

    expect(result?.state).toBe('completed')
    expect(result?.result).toEqual(videoResult)
  })

  it('returns failed state with error message', async () => {
    mockGetJob.mockResolvedValue({
      getState: vi.fn().mockResolvedValue('failed'),
      progress: 0,
      returnvalue: null,
      failedReason: 'Veo API quota exceeded',
    })

    const result = await getCompositeJobStatus('composite-org-456-111')

    expect(result?.state).toBe('failed')
    expect(result?.error).toBe('Veo API quota exceeded')
  })
})
