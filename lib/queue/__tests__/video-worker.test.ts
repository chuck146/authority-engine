import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildOrgContext, buildGenerateVideoResponse } from '@/tests/factories'
import type { VideoJobData } from '../video-worker'

const mockGenerateAndStoreVideo = vi.fn()

vi.mock('@/lib/ai/video-generator', () => ({
  generateAndStoreVideo: (...args: unknown[]) => mockGenerateAndStoreVideo(...args),
}))

vi.mock('bullmq', () => ({
  Worker: vi.fn(),
}))

vi.mock('../connection', () => ({
  getRedisConnection: vi.fn(() => ({})),
}))

const { processVideoJob } = await import('../video-worker')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('processVideoJob', () => {
  it('calls generateAndStoreVideo with correct args', async () => {
    const videoResponse = buildGenerateVideoResponse()
    mockGenerateAndStoreVideo.mockResolvedValue(videoResponse)

    const jobData: VideoJobData = {
      orgId: 'org-456',
      userId: 'user-123',
      input: {
        videoType: 'cinematic_reel',
        sceneDescription: 'A freshly painted room',
        audioMood: 'Warm strings',
        aspectRatio: '9:16',
        model: 'veo-3.1-fast-generate-preview',
      },
      orgContext: buildOrgContext(),
    }

    const mockJob = {
      data: jobData,
      updateProgress: vi.fn(),
    }

    const result = await processVideoJob(mockJob as never)

    expect(mockGenerateAndStoreVideo).toHaveBeenCalledWith(
      jobData.input,
      jobData.orgContext,
      'org-456',
      'user-123',
    )
    expect(result).toEqual(videoResponse)
    expect(mockJob.updateProgress).toHaveBeenCalledWith(10)
    expect(mockJob.updateProgress).toHaveBeenCalledWith(100)
  })

  it('propagates errors from generateAndStoreVideo', async () => {
    mockGenerateAndStoreVideo.mockRejectedValue(new Error('Veo API error'))

    const mockJob = {
      data: {
        orgId: 'org-456',
        userId: 'user-123',
        input: {
          videoType: 'cinematic_reel',
          sceneDescription: 'Test scene',
          audioMood: 'Test mood',
          aspectRatio: '9:16',
          model: 'veo-3.1-fast-generate-preview',
        },
        orgContext: buildOrgContext(),
      },
      updateProgress: vi.fn(),
    }

    await expect(processVideoJob(mockJob as never)).rejects.toThrow('Veo API error')
  })
})
