import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthContext } from '@/tests/factories'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

const mockRequireApiRole = vi.fn()
const mockEnqueueCompositeJob = vi.fn()
const mockSupabase = createMockSupabaseClient()

vi.mock('@/lib/auth/api-guard', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/auth/api-guard')>('@/lib/auth/api-guard')
  return {
    AuthError: actual.AuthError,
    requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

vi.mock('@/lib/queue/composite-scheduler', () => ({
  enqueueCompositeJob: (...args: unknown[]) => mockEnqueueCompositeJob(...args),
}))

vi.mock('@/lib/queue/video-scheduler', () => ({
  enqueueVideoJob: vi.fn(),
}))

vi.mock('@/lib/queue/remotion-scheduler', () => ({
  enqueueRemotionJob: vi.fn(),
}))

const { POST } = await import('/Applications/RCG/authority-engine/app/api/v1/video/generate/route')
const { AuthError } = await import('@/lib/auth/api-guard')

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/v1/video/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const defaultAuth = buildAuthContext()

function setupOrgMock() {
  mockSupabase.single.mockResolvedValueOnce({
    data: {
      name: 'Cleanest Painting LLC',
      domain: 'cleanestpainting.com',
      branding: { primary: '#1B2B5B', secondary: '#fbbf24', accent: '#1e3a5f' },
      settings: { service_area_states: ['NJ'], service_area_counties: ['Union'] },
    },
    error: null,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  mockSupabase.from.mockReturnValue(mockSupabase)
  mockSupabase.select.mockReturnValue(mockSupabase)
  mockSupabase.eq.mockReturnValue(mockSupabase)
})

describe('POST /api/v1/video/generate — composite_reel', () => {
  describe('happy paths', () => {
    it('returns 202 with composite job ID and engine=composite', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      setupOrgMock()
      mockEnqueueCompositeJob.mockResolvedValue('composite-org-456-1709820000000')

      const res = await POST(
        makeRequest({
          videoType: 'composite_reel',
          sceneDescription: 'A freshly painted living room with warm afternoon light',
          audioMood: 'Warm, uplifting orchestral strings',
          model: 'veo-3.1-fast-generate-preview',
          includeIntro: true,
          includeOutro: true,
          useStartingFrame: true,
        }),
      )

      expect(res.status).toBe(202)
      const json = await res.json()
      expect(json.jobId).toBe('composite-org-456-1709820000000')
      expect(json.status).toBe('queued')
      expect(json.engine).toBe('composite')
    })

    it('passes full composite job data to enqueueCompositeJob', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      setupOrgMock()
      mockEnqueueCompositeJob.mockResolvedValue('composite-org-456-111')

      await POST(
        makeRequest({
          videoType: 'composite_reel',
          sceneDescription: 'A freshly painted living room with warm afternoon light',
          audioMood: 'Warm orchestral',
          model: 'veo-3.1-fast-generate-preview',
          includeIntro: true,
          includeOutro: false,
          useStartingFrame: true,
          ctaText: 'Get Your Free Estimate',
          ctaUrl: 'cleanestpainting.com',
        }),
      )

      expect(mockEnqueueCompositeJob).toHaveBeenCalledOnce()
      const [jobData] = mockEnqueueCompositeJob.mock.calls[0]!
      expect(jobData.orgId).toBe(defaultAuth.organizationId)
      expect(jobData.userId).toBe(defaultAuth.userId)
      expect(jobData.sceneDescription).toBe(
        'A freshly painted living room with warm afternoon light',
      )
      expect(jobData.includeIntro).toBe(true)
      expect(jobData.includeOutro).toBe(false)
      expect(jobData.ctaText).toBe('Get Your Free Estimate')
      expect(jobData.orgContext.orgName).toBe('Cleanest Painting LLC')
    })

    it('accepts composite_reel without optional cta fields', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      setupOrgMock()
      mockEnqueueCompositeJob.mockResolvedValue('composite-org-456-222')

      const res = await POST(
        makeRequest({
          videoType: 'composite_reel',
          sceneDescription: 'Exterior painting project on a Victorian home',
          audioMood: 'Gentle ambient',
        }),
      )

      expect(res.status).toBe(202)
    })
  })

  describe('validation', () => {
    it('returns 400 when sceneDescription is missing', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      setupOrgMock()

      const res = await POST(
        makeRequest({
          videoType: 'composite_reel',
          audioMood: 'Warm orchestral',
        }),
      )

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Invalid request')
    })

    it('returns 400 when sceneDescription is too short', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      setupOrgMock()

      const res = await POST(
        makeRequest({
          videoType: 'composite_reel',
          sceneDescription: 'short',
          audioMood: 'Warm orchestral',
        }),
      )

      expect(res.status).toBe(400)
    })

    it('returns 400 when audioMood is missing', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      setupOrgMock()

      const res = await POST(
        makeRequest({
          videoType: 'composite_reel',
          sceneDescription: 'A freshly painted living room with warm afternoon light',
        }),
      )

      expect(res.status).toBe(400)
    })
  })

  describe('auth errors', () => {
    it('returns 401 when not authenticated', async () => {
      mockRequireApiRole.mockRejectedValue(new AuthError('Unauthorized', 401))

      const res = await POST(
        makeRequest({
          videoType: 'composite_reel',
          sceneDescription: 'A freshly painted living room',
          audioMood: 'Warm mood',
        }),
      )

      expect(res.status).toBe(401)
    })

    it('returns 403 when insufficient role', async () => {
      mockRequireApiRole.mockRejectedValue(new AuthError('Insufficient permissions', 403))

      const res = await POST(
        makeRequest({
          videoType: 'composite_reel',
          sceneDescription: 'A freshly painted living room',
          audioMood: 'Warm mood',
        }),
      )

      expect(res.status).toBe(403)
    })
  })

  describe('data errors', () => {
    it('returns 404 when organization not found', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: null })

      const res = await POST(
        makeRequest({
          videoType: 'composite_reel',
          sceneDescription: 'A freshly painted living room with warm afternoon light',
          audioMood: 'Warm orchestral',
        }),
      )

      expect(res.status).toBe(404)
    })

    it('returns 500 when enqueue fails', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      setupOrgMock()
      mockEnqueueCompositeJob.mockRejectedValue(new Error('Redis timeout'))

      const res = await POST(
        makeRequest({
          videoType: 'composite_reel',
          sceneDescription: 'A freshly painted living room with warm afternoon light',
          audioMood: 'Warm orchestral',
        }),
      )

      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to start video generation. Please try again.')
    })
  })
})
