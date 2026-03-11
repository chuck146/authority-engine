import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthContext } from '@/tests/factories'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

const mockRequireApiRole = vi.fn()
const mockEnqueueCompositeJob = vi.fn()
const mockEnqueueRemotionJob = vi.fn()
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

vi.mock('@/lib/queue/composite-scheduler', () => ({
  enqueueCompositeJob: (...args: unknown[]) => mockEnqueueCompositeJob(...args),
}))

vi.mock('@/lib/queue/remotion-scheduler', () => ({
  enqueueRemotionJob: (...args: unknown[]) => mockEnqueueRemotionJob(...args),
}))

vi.mock('@/lib/queue/video-scheduler', () => ({
  enqueueVideoJob: (...args: unknown[]) => mockEnqueueVideoJob(...args),
}))

const { POST } = await import('@/app/api/v1/video/generate/route')

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
      settings: { service_area_states: ['NJ'] },
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

describe('POST /api/v1/video/generate — font merging', () => {
  describe('composite engine fonts', () => {
    it('passes headingFont and bodyFont to enqueueCompositeJob', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      setupOrgMock()
      mockEnqueueCompositeJob.mockResolvedValue('composite-org-456-111')

      await POST(
        makeRequest({
          videoType: 'composite_reel',
          sceneDescription: 'A freshly painted living room with warm afternoon light',
          audioMood: 'Warm orchestral',
          headingFont: 'PlayfairDisplay',
          bodyFont: 'SpaceMono',
        }),
      )

      expect(mockEnqueueCompositeJob).toHaveBeenCalledOnce()
      const [jobData] = mockEnqueueCompositeJob.mock.calls[0]!
      expect(jobData.headingFont).toBe('PlayfairDisplay')
      expect(jobData.bodyFont).toBe('SpaceMono')
    })

    it('omits font fields when not provided (uses defaults downstream)', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      setupOrgMock()
      mockEnqueueCompositeJob.mockResolvedValue('composite-org-456-222')

      await POST(
        makeRequest({
          videoType: 'composite_reel',
          sceneDescription: 'A freshly painted living room with warm afternoon light',
          audioMood: 'Warm orchestral',
        }),
      )

      const [jobData] = mockEnqueueCompositeJob.mock.calls[0]!
      expect(jobData.headingFont).toBeUndefined()
      expect(jobData.bodyFont).toBeUndefined()
    })

    it('font fields are optional — omitting them does not cause validation errors', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      setupOrgMock()
      mockEnqueueCompositeJob.mockResolvedValue('composite-org-456-333')

      const res = await POST(
        makeRequest({
          videoType: 'composite_reel',
          sceneDescription: 'A freshly painted living room with warm afternoon light',
          audioMood: 'Warm orchestral',
        }),
      )

      expect(res.status).toBe(202)
    })
  })

  describe('remotion engine fonts', () => {
    it('merges headingFont into brand config for testimonial_quote', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      setupOrgMock()
      mockEnqueueRemotionJob.mockResolvedValue('remotion-org-456-111')

      await POST(
        makeRequest({
          videoType: 'testimonial_quote',
          quote: 'Amazing work!',
          customerName: 'Sarah M.',
          starRating: 5,
          headingFont: 'BebasNeue',
          bodyFont: 'CormorantGaramond',
        }),
      )

      expect(mockEnqueueRemotionJob).toHaveBeenCalledOnce()
      const inputProps = mockEnqueueRemotionJob.mock.calls[0]![3]
      expect(inputProps.brand.headingFont).toBe('BebasNeue')
      expect(inputProps.brand.bodyFont).toBe('CormorantGaramond')
    })

    it('uses default fonts (Montserrat/DMSans) when not provided', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      setupOrgMock()
      mockEnqueueRemotionJob.mockResolvedValue('remotion-org-456-222')

      await POST(
        makeRequest({
          videoType: 'testimonial_quote',
          quote: 'Amazing work!',
          customerName: 'Sarah M.',
          starRating: 5,
        }),
      )

      const inputProps = mockEnqueueRemotionJob.mock.calls[0]![3]
      expect(inputProps.brand.headingFont).toBe('Montserrat')
      expect(inputProps.brand.bodyFont).toBe('DMSans')
    })

    it('merges fonts for tip_video type', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      setupOrgMock()
      mockEnqueueRemotionJob.mockResolvedValue('remotion-org-456-333')

      await POST(
        makeRequest({
          videoType: 'tip_video',
          title: '3 Paint Tips',
          tips: [{ number: 1, text: 'Prep the surface' }],
          headingFont: 'Anton',
        }),
      )

      const inputProps = mockEnqueueRemotionJob.mock.calls[0]![3]
      expect(inputProps.brand.headingFont).toBe('Anton')
      expect(inputProps.brand.bodyFont).toBe('DMSans') // default
    })

    it('merges fonts for before_after_reveal type', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      setupOrgMock()
      mockEnqueueRemotionJob.mockResolvedValue('remotion-org-456-444')

      await POST(
        makeRequest({
          videoType: 'before_after_reveal',
          beforeImageUrl: 'https://example.com/before.jpg',
          afterImageUrl: 'https://example.com/after.jpg',
          bodyFont: 'Italiana',
        }),
      )

      const inputProps = mockEnqueueRemotionJob.mock.calls[0]![3]
      expect(inputProps.brand.headingFont).toBe('Montserrat') // default
      expect(inputProps.brand.bodyFont).toBe('Italiana')
    })
  })

  describe('veo engine fonts', () => {
    it('ignores font fields — veo schema does not include them', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      setupOrgMock()
      mockEnqueueVideoJob.mockResolvedValue('veo-org-456-111')

      const res = await POST(
        makeRequest({
          videoType: 'cinematic_reel',
          sceneDescription: 'A freshly painted living room with warm afternoon light',
          audioMood: 'Warm orchestral',
          model: 'veo-3.1-fast-generate-preview',
          aspectRatio: '9:16',
          headingFont: 'PlayfairDisplay',
          bodyFont: 'SpaceMono',
        }),
      )

      // Veo requests succeed (extra fields stripped by Zod passthrough/strip)
      expect(res.status).toBe(202)
      // Font fields should NOT be passed to the Veo job
      const [, , input] = mockEnqueueVideoJob.mock.calls[0]!
      expect(input.headingFont).toBeUndefined()
      expect(input.bodyFont).toBeUndefined()
    })
  })
})
