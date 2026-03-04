import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthContext, buildGenerateImageResponse } from '@/tests/factories'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

// --- Mocks ---

const mockRequireApiRole = vi.fn()
const mockGenerateAndStoreImage = vi.fn()
const mockSupabase = createMockSupabaseClient()

vi.mock('@/lib/auth/api-guard', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth/api-guard')>('@/lib/auth/api-guard')
  return {
    AuthError: actual.AuthError,
    requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

vi.mock('@/lib/ai', () => ({
  generateAndStoreImage: (...args: unknown[]) => mockGenerateAndStoreImage(...args),
}))

const { POST } = await import('../route')
const { AuthError } = await import('@/lib/auth/api-guard')

// --- Helpers ---

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/v1/media/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const defaultAuth = buildAuthContext()

function setupHappyPath() {
  mockRequireApiRole.mockResolvedValue(defaultAuth)
  mockGenerateAndStoreImage.mockResolvedValue(buildGenerateImageResponse())

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

// --- Setup ---

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  mockSupabase.from.mockReturnValue(mockSupabase)
  mockSupabase.select.mockReturnValue(mockSupabase)
  mockSupabase.eq.mockReturnValue(mockSupabase)
})

// --- Tests ---

describe('POST /api/v1/media/generate', () => {
  describe('happy paths', () => {
    it('returns 201 with response for blog_thumbnail', async () => {
      setupHappyPath()

      const res = await POST(makeRequest({
        imageType: 'blog_thumbnail',
        topic: 'Choosing Paint Colors',
        style: 'photorealistic',
        mood: 'warm',
      }))

      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.id).toBe('media-1')
      expect(json.imageType).toBe('blog_thumbnail')
      expect(json.publicUrl).toBeDefined()
    })

    it('returns 201 for location_hero', async () => {
      setupHappyPath()

      const res = await POST(makeRequest({
        imageType: 'location_hero',
        city: 'Summit',
        state: 'NJ',
        serviceName: 'Painting',
        style: 'photorealistic',
      }))

      expect(res.status).toBe(201)
    })

    it('returns 201 for social_graphic', async () => {
      setupHappyPath()

      const res = await POST(makeRequest({
        imageType: 'social_graphic',
        message: 'Spring special: 15% off exterior painting',
        style: 'flat',
        mood: 'vibrant',
      }))

      expect(res.status).toBe(201)
    })

    it('passes org context to generateAndStoreImage', async () => {
      setupHappyPath()

      await POST(makeRequest({
        imageType: 'blog_thumbnail',
        topic: 'Choosing Paint Colors',
        style: 'photorealistic',
        mood: 'warm',
      }))

      expect(mockGenerateAndStoreImage).toHaveBeenCalledOnce()
      const [, orgCtx, orgId, userId] = mockGenerateAndStoreImage.mock.calls[0]!
      expect(orgCtx.orgName).toBe('Cleanest Painting LLC')
      expect(orgId).toBe(defaultAuth.organizationId)
      expect(userId).toBe(defaultAuth.userId)
    })
  })

  describe('auth errors', () => {
    it('returns 401 when not authenticated', async () => {
      mockRequireApiRole.mockRejectedValue(new AuthError('Unauthorized', 401))

      const res = await POST(makeRequest({
        imageType: 'blog_thumbnail',
        topic: 'Choosing Paint Colors',
      }))

      expect(res.status).toBe(401)
    })

    it('returns 403 when insufficient role', async () => {
      mockRequireApiRole.mockRejectedValue(new AuthError('Insufficient permissions', 403))

      const res = await POST(makeRequest({
        imageType: 'blog_thumbnail',
        topic: 'Choosing Paint Colors',
      }))

      expect(res.status).toBe(403)
    })
  })

  describe('validation', () => {
    it('returns 400 for invalid imageType', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)

      const res = await POST(makeRequest({ imageType: 'invalid_type' }))

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Invalid request')
    })

    it('returns 400 for missing required fields', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)

      const res = await POST(makeRequest({
        imageType: 'blog_thumbnail',
        // missing topic
      }))

      expect(res.status).toBe(400)
    })

    it('returns 400 for location_hero with invalid state', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)

      const res = await POST(makeRequest({
        imageType: 'location_hero',
        city: 'Summit',
        state: 'New Jersey', // must be 2 chars
        serviceName: 'Painting',
      }))

      expect(res.status).toBe(400)
    })
  })

  describe('data errors', () => {
    it('returns 404 when organization not found', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: null })

      const res = await POST(makeRequest({
        imageType: 'blog_thumbnail',
        topic: 'Choosing Paint Colors',
        style: 'photorealistic',
        mood: 'warm',
      }))

      expect(res.status).toBe(404)
    })

    it('returns 500 for Gemini errors', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      mockSupabase.single.mockResolvedValueOnce({
        data: { name: 'Org', domain: null, branding: null, settings: null },
        error: null,
      })
      mockGenerateAndStoreImage.mockRejectedValue(new Error('Gemini API error'))

      const res = await POST(makeRequest({
        imageType: 'blog_thumbnail',
        topic: 'Choosing Paint Colors',
        style: 'photorealistic',
        mood: 'warm',
      }))

      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to generate image. Please try again.')
    })
  })
})
