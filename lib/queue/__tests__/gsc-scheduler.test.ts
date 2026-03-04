import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockQueueAdd = vi.fn().mockResolvedValue({ id: 'job-1' })

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: mockQueueAdd,
  })),
}))

vi.mock('../connection', () => ({
  getRedisConnection: vi.fn().mockReturnValue({}),
}))

const mockSelect = vi.fn()
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  })),
}))

describe('gsc-scheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('enqueueGscSync', () => {
    it('adds a one-off sync job to the queue', async () => {
      const { enqueueGscSync } = await import('../gsc-scheduler')
      const jobId = await enqueueGscSync('org-123')

      expect(jobId).toBe('job-1')
      expect(mockQueueAdd).toHaveBeenCalledWith(
        'sync-gsc',
        { organizationId: 'org-123' },
        expect.objectContaining({
          removeOnComplete: true,
          removeOnFail: false,
        }),
      )
    })
  })

  describe('scheduleDailyGscSync', () => {
    it('schedules repeating jobs for all active connections', async () => {
      mockSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { organization_id: 'org-1' },
              { organization_id: 'org-2' },
            ],
          }),
        }),
      })

      const { scheduleDailyGscSync } = await import('../gsc-scheduler')
      await scheduleDailyGscSync()

      expect(mockQueueAdd).toHaveBeenCalledTimes(2)
      expect(mockQueueAdd).toHaveBeenCalledWith(
        'sync-gsc-daily',
        { organizationId: 'org-1' },
        expect.objectContaining({
          repeat: { pattern: '0 6 * * *' },
          jobId: 'gsc-daily-org-1',
        }),
      )
    })

    it('does nothing when no active connections exist', async () => {
      mockSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })

      const { scheduleDailyGscSync } = await import('../gsc-scheduler')
      await scheduleDailyGscSync()

      expect(mockQueueAdd).not.toHaveBeenCalled()
    })
  })
})
