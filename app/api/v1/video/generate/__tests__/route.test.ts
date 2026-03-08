import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthContext } from '@/tests/factories'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

const mockRequireApiRole = vi.fn()
const mockEnqueueVideoJob = vi.fn()
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

vi.mock('@/lib/queue/video-scheduler', () => ({
  enqueueVideoJob: (...args: unknown[]) => mockEnqueueVideoJob(...args),
}))

const { POST } = await import('../route')
const { AuthError } = await import('@/lib/auth/api-guard')

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/v1/video/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const defaultAuth = buildAuthContext()

function setupHappyPath() {
  mockRequireApiRole.mockResolvedValue(defaultAuth)
  mockEnqueueVideoJob.mockResolvedValue('video-org-456-1709820000000')

  mockSupabase.single.mockResolvedValueOnce({
    data: {
      name: 'Cleanest Painting LLC',
      domain: 'cleanestpainting.com',
      branding: { primary: '#1a472a', secondary: '#fbbf24', accent: '#1e3a5f' },
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

describe('POST /api/v1/video/generate', () => {
  describe('happy paths', () => {
    it('returns 202 with job ID for cinematic_reel', async () => {
      setupHappyPath()

      const res = await POST(
        makeRequest({
          videoType: 'cinematic_reel',
          sceneDescription: 'A freshly painted living room with warm lighting',
          audioMood: 'Soft orchestral strings',
          aspectRatio: '9:16',
          model: 'veo-3.1-fast-generate-preview',
        }),
      )

      expect(res.status).toBe(202)
      const json = await res.json()
      expect(json.jobId).toBe('video-org-456-1709820000000')
      expect(json.status).toBe('queued')
    })

    it('returns 202 for project_showcase', async () => {
      setupHappyPath()

      const res = await POST(
        makeRequest({
          videoType: 'project_showcase',
          beforeDescription: 'Old peeling paint on walls',
          afterDescription: 'Fresh Benjamin Moore paint',
          location: 'Summit, NJ',
        }),
      )

      expect(res.status).toBe(202)
    })

    it('returns 202 for testimonial_scene', async () => {
      setupHappyPath()

      const res = await POST(
        makeRequest({
          videoType: 'testimonial_scene',
          quote: 'Excellent work, truly professional!',
          customerName: 'John Smith',
          sentiment: 'positive',
        }),
      )

      expect(res.status).toBe(202)
    })

    it('returns 202 for brand_story', async () => {
      setupHappyPath()

      const res = await POST(
        makeRequest({
          videoType: 'brand_story',
          narrative: 'From a small local shop to the premier painting company in NJ',
          style: 'cinematic',
        }),
      )

      expect(res.status).toBe(202)
    })

    it('passes org context to enqueueVideoJob', async () => {
      setupHappyPath()

      await POST(
        makeRequest({
          videoType: 'cinematic_reel',
          sceneDescription: 'A freshly painted living room',
          audioMood: 'Warm orchestral',
        }),
      )

      expect(mockEnqueueVideoJob).toHaveBeenCalledOnce()
      const [orgId, userId, , orgContext] = mockEnqueueVideoJob.mock.calls[0]!
      expect(orgId).toBe(defaultAuth.organizationId)
      expect(userId).toBe(defaultAuth.userId)
      expect(orgContext.orgName).toBe('Cleanest Painting LLC')
    })
  })

  describe('auth errors', () => {
    it('returns 401 when not authenticated', async () => {
      mockRequireApiRole.mockRejectedValue(new AuthError('Unauthorized', 401))

      const res = await POST(
        makeRequest({
          videoType: 'cinematic_reel',
          sceneDescription: 'Test scene description',
          audioMood: 'Test mood',
        }),
      )

      expect(res.status).toBe(401)
    })

    it('returns 403 when insufficient role', async () => {
      mockRequireApiRole.mockRejectedValue(new AuthError('Insufficient permissions', 403))

      const res = await POST(
        makeRequest({
          videoType: 'cinematic_reel',
          sceneDescription: 'Test scene description',
          audioMood: 'Test mood',
        }),
      )

      expect(res.status).toBe(403)
    })
  })

  describe('validation', () => {
    it('returns 400 for invalid videoType', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)

      const res = await POST(makeRequest({ videoType: 'invalid_type' }))

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Invalid request')
    })

    it('returns 400 for missing required fields', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)

      const res = await POST(
        makeRequest({
          videoType: 'cinematic_reel',
          // missing sceneDescription and audioMood
        }),
      )

      expect(res.status).toBe(400)
    })

    it('returns 400 for short scene description', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)

      const res = await POST(
        makeRequest({
          videoType: 'cinematic_reel',
          sceneDescription: 'short',
          audioMood: 'mood',
        }),
      )

      expect(res.status).toBe(400)
    })
  })

  describe('data errors', () => {
    it('returns 404 when organization not found', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: null })

      const res = await POST(
        makeRequest({
          videoType: 'cinematic_reel',
          sceneDescription: 'A freshly painted living room with natural light',
          audioMood: 'Soft orchestral strings',
        }),
      )

      expect(res.status).toBe(404)
    })

    it('returns 500 when enqueue fails', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      mockSupabase.single.mockResolvedValueOnce({
        data: { name: 'Org', domain: null, branding: null, settings: null },
        error: null,
      })
      mockEnqueueVideoJob.mockRejectedValue(new Error('Redis timeout'))

      const res = await POST(
        makeRequest({
          videoType: 'cinematic_reel',
          sceneDescription: 'A freshly painted living room with natural light',
          audioMood: 'Soft orchestral strings',
        }),
      )

      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to start video generation. Please try again.')
    })
  })
})
