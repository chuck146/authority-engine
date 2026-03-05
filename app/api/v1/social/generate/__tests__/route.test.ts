import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthContext } from '@/tests/factories'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

// --- Mocks ---

const mockRequireApiRole = vi.fn()
const mockGenerateSocialPost = vi.fn()
const mockGenerateAndStoreImage = vi.fn()
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

vi.mock('@/lib/ai/social-generator', () => ({
  generateSocialPost: (...args: unknown[]) => mockGenerateSocialPost(...args),
}))

vi.mock('@/lib/ai/image-generator', () => ({
  generateAndStoreImage: (...args: unknown[]) => mockGenerateAndStoreImage(...args),
}))

const { POST } = await import('../route')
const { AuthError } = await import('@/lib/auth/api-guard')

// --- Helpers ---

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/v1/social/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const defaultAuth = buildAuthContext()
const defaultSocialContent = {
  body: 'Check out our latest painting project!',
  hashtags: ['painting', 'homeimprovement'],
  cta_type: 'LEARN_MORE',
  cta_url: 'https://cleanestpainting.com',
  image_prompt: 'A beautifully painted living room',
}

function setupHappyPath() {
  mockRequireApiRole.mockResolvedValue(defaultAuth)
  mockGenerateSocialPost.mockResolvedValue(defaultSocialContent)

  mockSupabase.single
    .mockResolvedValueOnce({
      data: {
        name: 'Cleanest Painting LLC',
        domain: 'cleanestpainting.com',
        branding: { primary: '#1a472a', secondary: '#fbbf24', accent: '#1e3a5f' },
        settings: { service_area_states: ['NJ'], service_area_counties: ['Union'] },
      },
      error: null,
    })
    .mockResolvedValueOnce({
      data: { id: 'social-post-123' },
      error: null,
    })
}

// --- Setup ---

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  mockSupabase.from.mockReturnValue(mockSupabase)
  mockSupabase.select.mockReturnValue(mockSupabase)
  mockSupabase.insert.mockReturnValue(mockSupabase)
  mockSupabase.eq.mockReturnValue(mockSupabase)
  mockSupabase.returns.mockReturnValue(mockSupabase)
})

// --- Tests ---

describe('POST /api/v1/social/generate', () => {
  describe('happy paths', () => {
    it('returns 201 for GBP post generation', async () => {
      setupHappyPath()

      const res = await POST(
        makeRequest({
          platform: 'gbp',
          topic: 'Spring painting specials',
          tone: 'professional',
          postType: 'update',
        }),
      )

      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.platform).toBe('gbp')
      expect(json.body).toBe(defaultSocialContent.body)
      expect(json.status).toBe('review')
      expect(json.id).toBe('social-post-123')
    })

    it('returns 201 for Instagram post generation', async () => {
      setupHappyPath()

      const res = await POST(
        makeRequest({
          platform: 'instagram',
          topic: 'Before and after kitchen repaint',
          tone: 'friendly',
          mood: 'inspiring',
          hashtagCount: 20,
        }),
      )

      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.platform).toBe('instagram')
    })

    it('returns 201 for Facebook post generation', async () => {
      setupHappyPath()

      const res = await POST(
        makeRequest({
          platform: 'facebook',
          topic: 'Community project update',
          tone: 'friendly',
        }),
      )

      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.platform).toBe('facebook')
    })

    it('generates image when generateImage is true', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      mockGenerateSocialPost.mockResolvedValue(defaultSocialContent)
      mockGenerateAndStoreImage.mockResolvedValue({ id: 'media-456' })

      mockSupabase.single
        .mockResolvedValueOnce({
          data: { name: 'Org', domain: 'example.com', branding: null, settings: null },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'social-with-image' },
          error: null,
        })

      const res = await POST(
        makeRequest({
          platform: 'gbp',
          topic: 'Spring special',
          tone: 'professional',
          generateImage: true,
        }),
      )

      expect(res.status).toBe(201)
      expect(mockGenerateAndStoreImage).toHaveBeenCalledOnce()
      const json = await res.json()
      expect(json.mediaAssetId).toBe('media-456')
    })

    it('continues without image when image generation fails', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      mockGenerateSocialPost.mockResolvedValue(defaultSocialContent)
      mockGenerateAndStoreImage.mockRejectedValue(new Error('Gemini down'))

      mockSupabase.single
        .mockResolvedValueOnce({
          data: { name: 'Org', domain: null, branding: null, settings: null },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'social-no-image' },
          error: null,
        })

      const res = await POST(
        makeRequest({
          platform: 'instagram',
          topic: 'Test post',
          tone: 'friendly',
          generateImage: true,
        }),
      )

      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.mediaAssetId).toBeNull()
    })

    it('passes org context to generateSocialPost', async () => {
      setupHappyPath()

      await POST(
        makeRequest({
          platform: 'gbp',
          topic: 'Test',
          tone: 'professional',
        }),
      )

      expect(mockGenerateSocialPost).toHaveBeenCalledOnce()
      const [, orgCtx] = mockGenerateSocialPost.mock.calls[0]!
      expect(orgCtx.orgName).toBe('Cleanest Painting LLC')
    })
  })

  describe('auth errors', () => {
    it('returns 401 when not authenticated', async () => {
      mockRequireApiRole.mockRejectedValue(new AuthError('Unauthorized', 401))

      const res = await POST(
        makeRequest({
          platform: 'gbp',
          topic: 'Test',
        }),
      )

      expect(res.status).toBe(401)
    })

    it('returns 403 when insufficient role', async () => {
      mockRequireApiRole.mockRejectedValue(new AuthError('Insufficient permissions', 403))

      const res = await POST(
        makeRequest({
          platform: 'gbp',
          topic: 'Test',
        }),
      )

      expect(res.status).toBe(403)
    })
  })

  describe('validation', () => {
    it('returns 400 for invalid platform', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)

      const res = await POST(makeRequest({ platform: 'tiktok', topic: 'Test' }))

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Invalid request')
    })

    it('returns 400 for missing topic', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)

      const res = await POST(makeRequest({ platform: 'gbp' }))

      expect(res.status).toBe(400)
    })

    it('returns 400 for topic too short', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)

      const res = await POST(makeRequest({ platform: 'gbp', topic: 'ab' }))

      expect(res.status).toBe(400)
    })
  })

  describe('data errors', () => {
    it('returns 404 when organization not found', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: null })

      const res = await POST(
        makeRequest({
          platform: 'gbp',
          topic: 'Spring special',
          tone: 'professional',
        }),
      )

      expect(res.status).toBe(404)
    })

    it('returns 500 for AI generation failure', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      mockGenerateSocialPost.mockRejectedValue(new Error('Claude API down'))
      mockSupabase.single.mockResolvedValueOnce({
        data: { name: 'Org', domain: null, branding: null, settings: null },
        error: null,
      })

      const res = await POST(
        makeRequest({
          platform: 'gbp',
          topic: 'Spring special',
          tone: 'professional',
        }),
      )

      expect(res.status).toBe(500)
    })
  })
})
