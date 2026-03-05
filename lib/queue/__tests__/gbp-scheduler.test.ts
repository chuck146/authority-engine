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

describe('gbp-scheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('enqueueGbpSync', () => {
    it('adds a one-off sync job to the queue', async () => {
      const { enqueueGbpSync } = await import('../gbp-scheduler')
      const jobId = await enqueueGbpSync('org-123')

      expect(jobId).toBe('job-1')
      expect(mockQueueAdd).toHaveBeenCalledWith(
        'sync-gbp',
        { organizationId: 'org-123' },
        expect.objectContaining({
          removeOnComplete: true,
          removeOnFail: false,
        }),
      )
    })
  })

  describe('scheduleDailyGbpSync', () => {
    it('schedules repeating jobs for all active connections', async () => {
      mockSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ organization_id: 'org-1' }, { organization_id: 'org-2' }],
          }),
        }),
      })

      const { scheduleDailyGbpSync } = await import('../gbp-scheduler')
      await scheduleDailyGbpSync()

      expect(mockQueueAdd).toHaveBeenCalledTimes(2)
      expect(mockQueueAdd).toHaveBeenCalledWith(
        'sync-gbp-daily',
        { organizationId: 'org-1' },
        expect.objectContaining({
          repeat: { pattern: '0 8 * * *' },
          jobId: 'gbp-daily-org-1',
        }),
      )
      expect(mockQueueAdd).toHaveBeenCalledWith(
        'sync-gbp-daily',
        { organizationId: 'org-2' },
        expect.objectContaining({
          repeat: { pattern: '0 8 * * *' },
          jobId: 'gbp-daily-org-2',
        }),
      )
    })

    it('does nothing when no active connections exist', async () => {
      mockSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })

      const { scheduleDailyGbpSync } = await import('../gbp-scheduler')
      await scheduleDailyGbpSync()

      expect(mockQueueAdd).not.toHaveBeenCalled()
    })
  })
})
