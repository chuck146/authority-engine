import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAdd = vi.fn()
const mockGetJob = vi.fn()

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: mockAdd,
    getJob: mockGetJob,
  })),
}))

vi.mock('@/lib/queue/connection', () => ({
  getRedisConnection: vi.fn().mockReturnValue({}),
}))

import { enqueuePremiumJob, getPremiumJobStatus } from '@/lib/queue/premium-scheduler'
import { buildPremiumJobData } from '../factories'

describe('premium-scheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('enqueuePremiumJob', () => {
    it('enqueues with premium- prefix job ID', async () => {
      const jobData = buildPremiumJobData()
      mockAdd.mockResolvedValue({ id: 'premium-org-456-1709820000000' })

      const jobId = await enqueuePremiumJob(jobData)

      expect(jobId).toBe('premium-org-456-1709820000000')
      expect(mockAdd).toHaveBeenCalledWith(
        'render-premium',
        jobData,
        expect.objectContaining({
          jobId: expect.stringMatching(/^premium-org-456-/),
          attempts: 2,
          backoff: { type: 'exponential', delay: 15_000 },
        }),
      )
    })

    it('returns fallback job ID when add returns null id', async () => {
      mockAdd.mockResolvedValue({ id: null })

      const jobId = await enqueuePremiumJob(buildPremiumJobData())

      expect(jobId).toMatch(/^premium-org-456-/)
    })

    it('sets removeOnComplete and removeOnFail to false', async () => {
      mockAdd.mockResolvedValue({ id: 'premium-org-456-123' })

      await enqueuePremiumJob(buildPremiumJobData())

      expect(mockAdd).toHaveBeenCalledWith(
        'render-premium',
        expect.anything(),
        expect.objectContaining({
          removeOnComplete: false,
          removeOnFail: false,
        }),
      )
    })
  })

  describe('getPremiumJobStatus', () => {
    it('returns null when job not found', async () => {
      mockGetJob.mockResolvedValue(null)

      const result = await getPremiumJobStatus('premium-org-456-999')

      expect(result).toBeNull()
    })

    it('returns queued state for waiting job', async () => {
      mockGetJob.mockResolvedValue({
        progress: 0,
        getState: vi.fn().mockResolvedValue('waiting'),
      })

      const result = await getPremiumJobStatus('premium-org-456-123')

      expect(result).toEqual({
        state: 'queued',
        progress: 0,
        premiumStep: null,
        result: undefined,
        error: undefined,
      })
    })

    it('returns processing state with premiumStep', async () => {
      const stepProgress = {
        currentStep: 'scenes',
        stepLabel: 'Rendering cinematic scenes...',
        overallProgress: 45,
        sceneProgress: { currentScene: 2, totalScenes: 3 },
      }

      mockGetJob.mockResolvedValue({
        progress: stepProgress,
        getState: vi.fn().mockResolvedValue('active'),
      })

      const result = await getPremiumJobStatus('premium-org-456-123')

      expect(result).toEqual({
        state: 'processing',
        progress: 45,
        premiumStep: stepProgress,
        result: undefined,
        error: undefined,
      })
    })

    it('returns completed state with result', async () => {
      const videoResult = {
        id: 'video-1',
        videoType: 'premium_reel',
        filename: 'premium-reel-123.mp4',
        storagePath: 'org-456/videos/premium_reel/abc.mp4',
        publicUrl: 'https://example.com/abc.mp4',
        mimeType: 'video/mp4',
        sizeBytes: 10485760,
        durationSeconds: 30,
      }

      mockGetJob.mockResolvedValue({
        progress: { currentStep: 'upload', stepLabel: 'Uploading...', overallProgress: 100 },
        getState: vi.fn().mockResolvedValue('completed'),
        returnvalue: videoResult,
      })

      const result = await getPremiumJobStatus('premium-org-456-123')

      expect(result?.state).toBe('completed')
      expect(result?.result).toEqual(videoResult)
    })

    it('returns failed state with error', async () => {
      mockGetJob.mockResolvedValue({
        progress: { currentStep: 'scenes', stepLabel: 'Rendering...', overallProgress: 40 },
        getState: vi.fn().mockResolvedValue('failed'),
        failedReason: 'Veo generation timed out',
      })

      const result = await getPremiumJobStatus('premium-org-456-123')

      expect(result?.state).toBe('failed')
      expect(result?.error).toBe('Veo generation timed out')
    })

    it('handles numeric progress (no step data)', async () => {
      mockGetJob.mockResolvedValue({
        progress: 50,
        getState: vi.fn().mockResolvedValue('active'),
      })

      const result = await getPremiumJobStatus('premium-org-456-123')

      expect(result?.progress).toBe(50)
      expect(result?.premiumStep).toBeNull()
    })
  })
})
