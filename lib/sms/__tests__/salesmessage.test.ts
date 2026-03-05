import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SalesMessageAdapter, normalizePhone, createSmsAdapter } from '../salesmessage'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('normalizePhone', () => {
  it('adds +1 to 10-digit US numbers', () => {
    expect(normalizePhone('2015551234')).toBe('+12015551234')
  })

  it('adds + to 11-digit numbers starting with 1', () => {
    expect(normalizePhone('12015551234')).toBe('+12015551234')
  })

  it('strips non-digit characters', () => {
    expect(normalizePhone('(201) 555-1234')).toBe('+12015551234')
  })

  it('preserves E.164 format', () => {
    expect(normalizePhone('+12015551234')).toBe('+12015551234')
  })

  it('handles international numbers', () => {
    expect(normalizePhone('+442071234567')).toBe('+442071234567')
  })
})

describe('SalesMessageAdapter', () => {
  const adapter = new SalesMessageAdapter({
    apiKey: 'test-key',
    numberId: 'num-1',
    teamId: 'team-1',
  })

  describe('getStatus', () => {
    it('returns configured when all fields present', () => {
      const status = adapter.getStatus()
      expect(status.isConfigured).toBe(true)
      expect(status.provider).toBe('salesmessage')
    })

    it('returns not configured when missing fields', () => {
      const partial = new SalesMessageAdapter({ apiKey: '', numberId: '', teamId: '' })
      expect(partial.getStatus().isConfigured).toBe(false)
    })
  })

  describe('send', () => {
    it('sends SMS via two-step API flow', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: 42 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: 99 } }),
        })

      const result = await adapter.send({
        to: '2015551234',
        message: 'Hello!',
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('99')

      // Verify conversation creation
      expect(mockFetch).toHaveBeenCalledTimes(2)
      const convCall = mockFetch.mock.calls[0]!
      expect(convCall[0]).toContain('/conversations')
      const convBody = JSON.parse(convCall[1].body as string)
      expect(convBody.phones).toEqual(['+12015551234'])
      expect(convBody.number_id).toBe('num-1')
      expect(convBody.team_id).toBe('team-1')

      // Verify message send
      const msgCall = mockFetch.mock.calls[1]!
      expect(msgCall[0]).toContain('/messages/42')
      const msgBody = JSON.parse(msgCall[1].body as string)
      expect(msgBody.content).toBe('Hello!')
    })

    it('returns error when conversation creation fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: async () => 'Invalid phone',
      })

      const result = await adapter.send({
        to: '2015551234',
        message: 'Hello!',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to create conversation')
      expect(result.error).toContain('422')
    })

    it('returns error when message send fails', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: 42 } }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'Internal error',
        })

      const result = await adapter.send({
        to: '2015551234',
        message: 'Hello!',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to send message')
    })

    it('handles network error on conversation', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'))

      const result = await adapter.send({
        to: '2015551234',
        message: 'Hello!',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error creating conversation')
    })

    it('handles network error on message', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: 42 } }),
        })
        .mockRejectedValueOnce(new Error('Timeout'))

      const result = await adapter.send({
        to: '2015551234',
        message: 'Hello!',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error sending message')
    })
  })
})

describe('createSmsAdapter', () => {
  it('creates adapter from environment variables', () => {
    vi.stubEnv('SALESMESSAGE_API_KEY', 'env-key')
    vi.stubEnv('SALESMESSAGE_NUMBER_ID', 'env-num')
    vi.stubEnv('SALESMESSAGE_TEAM_ID', 'env-team')

    const adapter = createSmsAdapter()
    const status = adapter.getStatus()
    expect(status.isConfigured).toBe(true)
    expect(status.provider).toBe('salesmessage')

    vi.unstubAllEnvs()
  })
})
