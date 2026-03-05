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

describe('ga4-scheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('enqueueGa4Sync', () => {
    it('adds a one-off sync job to the queue', async () => {
      const { enqueueGa4Sync } = await import('../ga4-scheduler')
      const jobId = await enqueueGa4Sync('org-123')

      expect(jobId).toBe('job-1')
      expect(mockQueueAdd).toHaveBeenCalledWith(
        'sync-ga4',
        { organizationId: 'org-123' },
        expect.objectContaining({
          removeOnComplete: true,
          removeOnFail: false,
        }),
      )
    })
  })

  describe('scheduleDailyGa4Sync', () => {
    it('schedules repeating jobs for all active connections', async () => {
      mockSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ organization_id: 'org-1' }, { organization_id: 'org-2' }],
          }),
        }),
      })

      const { scheduleDailyGa4Sync } = await import('../ga4-scheduler')
      await scheduleDailyGa4Sync()

      expect(mockQueueAdd).toHaveBeenCalledTimes(2)
      expect(mockQueueAdd).toHaveBeenCalledWith(
        'sync-ga4-daily',
        { organizationId: 'org-1' },
        expect.objectContaining({
          repeat: { pattern: '0 7 * * *' },
          jobId: 'ga4-daily-org-1',
        }),
      )
    })

    it('does nothing when no active connections exist', async () => {
      mockSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })

      const { scheduleDailyGa4Sync } = await import('../ga4-scheduler')
      await scheduleDailyGa4Sync()

      expect(mockQueueAdd).not.toHaveBeenCalled()
    })

    it('does nothing when data is null', async () => {
      mockSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null }),
        }),
      })

      const { scheduleDailyGa4Sync } = await import('../ga4-scheduler')
      await scheduleDailyGa4Sync()

      expect(mockQueueAdd).not.toHaveBeenCalled()
    })
  })
})
