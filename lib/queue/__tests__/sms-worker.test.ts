import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Job } from 'bullmq'
import type { SmsJobData } from '../sms-worker'

// --- Mocks ---

const mockSingle = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockSelect = vi.fn()
const mockFrom = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

const mockSend = vi.fn()
const mockGetStatus = vi.fn()

vi.mock('@/lib/sms', () => ({
  createSmsAdapter: () => ({
    send: mockSend,
    getStatus: mockGetStatus,
  }),
}))

vi.mock('@/lib/sms/message-template', () => ({
  buildReviewRequestMessage: vi.fn(() => 'Test review request message'),
}))

vi.mock('../connection', () => ({
  getRedisConnection: vi.fn(),
}))

const { processSmsJob } = await import('../sms-worker')

function makeJob(data: SmsJobData): Job<SmsJobData> {
  return { data } as Job<SmsJobData>
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})

  // Default chain: from → select/update → eq → eq → single
  const chain = { select: mockSelect, update: mockUpdate, eq: mockEq, single: mockSingle }
  mockFrom.mockReturnValue(chain)
  mockSelect.mockReturnValue(chain)
  mockUpdate.mockReturnValue(chain)
  mockEq.mockReturnValue(chain)
})

describe('processSmsJob', () => {
  const jobData: SmsJobData = {
    reviewRequestId: 'req-1',
    organizationId: 'org-1',
  }

  it('sends SMS and updates status to sent', async () => {
    // First call: review_requests query
    mockSingle
      .mockResolvedValueOnce({
        data: {
          id: 'req-1',
          customer_name: 'John Smith',
          customer_phone: '+12015551234',
          review_url: 'https://g.page/review',
          status: 'pending',
          metadata: {},
        },
        error: null,
      })
      // Second call: organizations query
      .mockResolvedValueOnce({
        data: { name: 'Cleanest Painting LLC' },
        error: null,
      })

    mockSend.mockResolvedValueOnce({ success: true, messageId: 'msg-99' })

    await processSmsJob(makeJob(jobData))

    expect(mockSend).toHaveBeenCalledWith({
      to: '+12015551234',
      message: 'Test review request message',
    })
    // Status should be updated to 'sent'
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'sent' }),
    )
  })

  it('updates status to failed when SMS fails', async () => {
    mockSingle
      .mockResolvedValueOnce({
        data: {
          id: 'req-1',
          customer_name: 'John',
          customer_phone: '+12015551234',
          review_url: 'https://g.page/review',
          status: 'pending',
          metadata: {},
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { name: 'Test Org' },
        error: null,
      })

    mockSend.mockResolvedValueOnce({ success: false, error: 'Invalid phone' })

    await expect(processSmsJob(makeJob(jobData))).rejects.toThrow('Invalid phone')
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed', error_message: 'Invalid phone' }),
    )
  })

  it('skips when request not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } })

    await processSmsJob(makeJob(jobData))

    expect(mockSend).not.toHaveBeenCalled()
  })

  it('skips when request already sent', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'req-1',
        status: 'sent',
        customer_phone: '+12015551234',
      },
      error: null,
    })

    await processSmsJob(makeJob(jobData))

    expect(mockSend).not.toHaveBeenCalled()
  })

  it('fails when no phone number provided', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'req-1',
        customer_name: 'John',
        customer_phone: null,
        review_url: 'https://g.page/review',
        status: 'pending',
        metadata: {},
      },
      error: null,
    })

    await processSmsJob(makeJob(jobData))

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed', error_message: 'No phone number provided' }),
    )
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('allows resending failed requests', async () => {
    mockSingle
      .mockResolvedValueOnce({
        data: {
          id: 'req-1',
          customer_name: 'John',
          customer_phone: '+12015551234',
          review_url: 'https://g.page/review',
          status: 'failed',
          metadata: {},
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { name: 'Test Org' },
        error: null,
      })

    mockSend.mockResolvedValueOnce({ success: true, messageId: 'msg-100' })

    await processSmsJob(makeJob(jobData))

    expect(mockSend).toHaveBeenCalled()
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'sent' }),
    )
  })

  it('passes custom message from metadata', async () => {
    mockSingle
      .mockResolvedValueOnce({
        data: {
          id: 'req-1',
          customer_name: 'John',
          customer_phone: '+12015551234',
          review_url: 'https://g.page/review',
          status: 'pending',
          metadata: { customMessage: 'Custom: {name} review us at {url}' },
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { name: 'Test Org' },
        error: null,
      })

    mockSend.mockResolvedValueOnce({ success: true, messageId: 'msg-101' })

    const { buildReviewRequestMessage } = await import('@/lib/sms/message-template')
    await processSmsJob(makeJob(jobData))

    expect(buildReviewRequestMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        customMessage: 'Custom: {name} review us at {url}',
      }),
    )
  })
})
