import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildStructuredContent, buildAuthContext } from '@/tests/factories'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

// --- Mocks ---

const mockRequireApiRole = vi.fn()
const mockGenerateContent = vi.fn()
const mockGenerateSlug = vi.fn()
const mockGenerateTitleFromInput = vi.fn()
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
  generateContent: (...args: unknown[]) => mockGenerateContent(...args),
}))

vi.mock('@/lib/ai/utils', () => ({
  generateSlug: (...args: unknown[]) => mockGenerateSlug(...args),
  generateTitleFromInput: (...args: unknown[]) => mockGenerateTitleFromInput(...args),
}))

vi.mock('@/lib/seo', () => ({
  calculateSeoScoreValue: vi.fn(() => 72),
}))

const { POST } = await import('../route')
const { AuthError } = await import('@/lib/auth/api-guard')

// --- Helpers ---

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/v1/content/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const defaultAuth = buildAuthContext()
const defaultContent = buildStructuredContent()

function setupHappyPath() {
  mockRequireApiRole.mockResolvedValue(defaultAuth)
  mockGenerateContent.mockResolvedValue(defaultContent)
  mockGenerateSlug.mockReturnValue('interior-painting')
  mockGenerateTitleFromInput.mockReturnValue('Interior Painting')

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
      data: { id: 'inserted-123' },
      error: null,
    })
}

function setupOrgOnly() {
  mockRequireApiRole.mockResolvedValue(defaultAuth)
  mockSupabase.single.mockResolvedValueOnce({
    data: {
      name: 'Test Org',
      domain: null,
      branding: null,
      settings: null,
    },
    error: null,
  })
}

// --- Setup ---

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  // Re-wire chain after clearAllMocks
  mockSupabase.from.mockReturnValue(mockSupabase)
  mockSupabase.select.mockReturnValue(mockSupabase)
  mockSupabase.insert.mockReturnValue(mockSupabase)
  mockSupabase.eq.mockReturnValue(mockSupabase)
  mockSupabase.returns.mockReturnValue(mockSupabase)
})

// --- Tests ---

describe('POST /api/v1/content/generate', () => {
  describe('happy paths', () => {
    it('returns 201 with correct response for service_page', async () => {
      setupHappyPath()

      const res = await POST(makeRequest({
        contentType: 'service_page',
        serviceName: 'Interior Painting',
        tone: 'professional',
      }))

      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json).toEqual({
        id: 'inserted-123',
        contentType: 'service_page',
        title: 'Interior Painting',
        slug: 'interior-painting',
        content: defaultContent,
        status: 'review',
        seoScore: 72,
      })
    })

    it('returns 201 for location_page', async () => {
      setupHappyPath()

      const res = await POST(makeRequest({
        contentType: 'location_page',
        city: 'Summit',
        state: 'NJ',
        serviceName: 'Painting',
        tone: 'professional',
      }))

      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.contentType).toBe('location_page')
    })

    it('returns 201 for blog_post', async () => {
      setupHappyPath()

      const res = await POST(makeRequest({
        contentType: 'blog_post',
        topic: 'Choosing Paint Colors',
        tone: 'friendly',
        targetWordCount: 800,
      }))

      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.contentType).toBe('blog_post')
    })

    it('inserts into correct table per content type', async () => {
      setupHappyPath()

      await POST(makeRequest({
        contentType: 'service_page',
        serviceName: 'Interior Painting',
        tone: 'professional',
      }))

      const fromCalls = mockSupabase.from.mock.calls
      expect(fromCalls[0]![0]).toBe('organizations')
      expect(fromCalls[1]![0]).toBe('service_pages')
    })

    it('includes seo_score in insert payload', async () => {
      setupHappyPath()

      await POST(makeRequest({
        contentType: 'service_page',
        serviceName: 'Interior Painting',
        tone: 'professional',
      }))

      const insertPayload = mockSupabase.insert.mock.calls[0]![0] as Record<string, unknown>
      expect(insertPayload.seo_score).toBe(72)
    })

    it('passes org context to generateContent', async () => {
      setupHappyPath()

      await POST(makeRequest({
        contentType: 'service_page',
        serviceName: 'Interior Painting',
        tone: 'professional',
      }))

      expect(mockGenerateContent).toHaveBeenCalledOnce()
      const [, orgCtx] = mockGenerateContent.mock.calls[0]!
      expect(orgCtx.orgName).toBe('Cleanest Painting LLC')
      expect(orgCtx.domain).toBe('cleanestpainting.com')
    })
  })

  describe('auth errors', () => {
    it('returns 401 when not authenticated', async () => {
      mockRequireApiRole.mockRejectedValue(new AuthError('Unauthorized', 401))

      const res = await POST(makeRequest({
        contentType: 'service_page',
        serviceName: 'Painting',
      }))

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toBe('Unauthorized')
    })

    it('returns 403 when insufficient role', async () => {
      mockRequireApiRole.mockRejectedValue(new AuthError('Insufficient permissions', 403))

      const res = await POST(makeRequest({
        contentType: 'service_page',
        serviceName: 'Painting',
      }))

      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.error).toBe('Insufficient permissions')
    })
  })

  describe('validation', () => {
    it('returns 400 for invalid contentType', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)

      const res = await POST(makeRequest({ contentType: 'invalid_type' }))

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Invalid request')
      expect(json.details).toBeDefined()
    })

    it('returns 400 for missing required fields', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)

      const res = await POST(makeRequest({
        contentType: 'service_page',
        // missing serviceName
      }))

      expect(res.status).toBe(400)
    })

    it('returns 400 for location_page with invalid state', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)

      const res = await POST(makeRequest({
        contentType: 'location_page',
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
        contentType: 'service_page',
        serviceName: 'Painting',
        tone: 'professional',
      }))

      expect(res.status).toBe(404)
      const json = await res.json()
      expect(json.error).toBe('Organization not found')
    })

    it('returns 409 for duplicate slug (Supabase 23505)', async () => {
      setupOrgOnly()
      mockGenerateContent.mockResolvedValue(defaultContent)
      mockGenerateSlug.mockReturnValue('interior-painting')
      mockGenerateTitleFromInput.mockReturnValue('Interior Painting')

      // Insert throws duplicate key
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: '23505', message: 'duplicate key value' },
      })

      const res = await POST(makeRequest({
        contentType: 'service_page',
        serviceName: 'Interior Painting',
        tone: 'professional',
      }))

      expect(res.status).toBe(409)
      const json = await res.json()
      expect(json.error).toContain('slug already exists')
    })

    it('returns 500 for generic errors', async () => {
      setupOrgOnly()
      mockGenerateContent.mockRejectedValue(new Error('AI service down'))

      const res = await POST(makeRequest({
        contentType: 'service_page',
        serviceName: 'Interior Painting',
        tone: 'professional',
      }))

      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Failed to generate content. Please try again.')
    })
  })

  describe('blog_post specifics', () => {
    it('uses headline as title instead of generateTitleFromInput', async () => {
      const blogContent = buildStructuredContent({ headline: 'My Custom Blog Title' })
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      mockGenerateContent.mockResolvedValue(blogContent)
      mockGenerateSlug.mockReturnValue('my-custom-blog-title')

      mockSupabase.single
        .mockResolvedValueOnce({
          data: { name: 'Org', domain: null, branding: null, settings: null },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'blog-123' },
          error: null,
        })

      const res = await POST(makeRequest({
        contentType: 'blog_post',
        topic: 'Something',
        tone: 'friendly',
        targetWordCount: 800,
      }))

      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.title).toBe('My Custom Blog Title')
      expect(mockGenerateTitleFromInput).not.toHaveBeenCalled()
    })

    it('calculates reading_time_minutes >= 1', async () => {
      const shortContent = buildStructuredContent({
        intro: 'Short.',
        sections: [{ title: 'A', body: 'B' }],
        cta: 'Go.',
      })
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      mockGenerateContent.mockResolvedValue(shortContent)
      mockGenerateSlug.mockReturnValue('short-blog')

      mockSupabase.single
        .mockResolvedValueOnce({
          data: { name: 'Org', domain: null, branding: null, settings: null },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'blog-short' },
          error: null,
        })

      await POST(makeRequest({
        contentType: 'blog_post',
        topic: 'Short Post',
        tone: 'friendly',
        targetWordCount: 300,
      }))

      const insertPayload = mockSupabase.insert.mock.calls[0]![0] as Record<string, unknown>
      expect(insertPayload.reading_time_minutes).toBeGreaterThanOrEqual(1)
    })

    it('truncates excerpt to 200 chars from intro', async () => {
      const longIntro = 'A'.repeat(300)
      const blogContent = buildStructuredContent({ intro: longIntro })
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      mockGenerateContent.mockResolvedValue(blogContent)
      mockGenerateSlug.mockReturnValue('long-intro-blog')

      mockSupabase.single
        .mockResolvedValueOnce({
          data: { name: 'Org', domain: null, branding: null, settings: null },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'blog-long' },
          error: null,
        })

      await POST(makeRequest({
        contentType: 'blog_post',
        topic: 'Long Intro Blog',
        tone: 'friendly',
        targetWordCount: 800,
      }))

      const insertPayload = mockSupabase.insert.mock.calls[0]![0] as Record<string, unknown>
      expect(insertPayload.excerpt).toHaveLength(200)
    })
  })
})
