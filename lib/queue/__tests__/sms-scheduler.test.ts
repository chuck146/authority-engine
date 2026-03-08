import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ---

const mockAdd = vi.fn()

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: mockAdd,
  })),
}))

vi.mock('../connection', () => ({
  getRedisConnection: vi.fn(),
}))

const { enqueueSmsJob } = await import('../sms-scheduler')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('enqueueSmsJob', () => {
  it('enqueues an SMS send job', async () => {
    mockAdd.mockResolvedValueOnce({ id: 'sms-req-1-123' })

    const jobId = await enqueueSmsJob('req-1', 'org-1')

    expect(jobId).toBe('sms-req-1-123')
    expect(mockAdd).toHaveBeenCalledWith(
      'send-sms',
      { reviewRequestId: 'req-1', organizationId: 'org-1' },
      expect.objectContaining({
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
      }),
    )
  })

  it('returns reviewRequestId when job id is undefined', async () => {
    mockAdd.mockResolvedValueOnce({ id: undefined })

    const jobId = await enqueueSmsJob('req-2', 'org-1')

    expect(jobId).toBe('req-2')
  })

  it('includes exponential backoff config', async () => {
    mockAdd.mockResolvedValueOnce({ id: 'job-1' })

    await enqueueSmsJob('req-3', 'org-1')

    expect(mockAdd).toHaveBeenCalledWith(
      'send-sms',
      expect.any(Object),
      expect.objectContaining({
        backoff: { type: 'exponential', delay: 5_000 },
      }),
    )
  })

  it('rejects on Redis timeout', { timeout: 10_000 }, async () => {
    mockAdd.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 10_000)))

    await expect(enqueueSmsJob('req-4', 'org-1')).rejects.toThrow('Redis timeout')
  })
})
