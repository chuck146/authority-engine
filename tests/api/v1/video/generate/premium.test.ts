import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRequireApiRole = vi.fn()
vi.mock('@/lib/auth/api-guard', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/auth/api-guard')>()
  return {
    ...actual,
    requireApiRole: mockRequireApiRole,
  }
})

const mockSingle = vi.fn()
const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
}))

const mockEnqueuePremiumJob = vi.fn()
vi.mock('@/lib/queue/premium-scheduler', () => ({
  enqueuePremiumJob: mockEnqueuePremiumJob,
}))

vi.mock('@/lib/queue/video-scheduler', () => ({
  enqueueVideoJob: vi.fn(),
}))

vi.mock('@/lib/queue/remotion-scheduler', () => ({
  enqueueRemotionJob: vi.fn(),
}))

vi.mock('@/lib/queue/composite-scheduler', () => ({
  enqueueCompositeJob: vi.fn(),
}))

describe('POST /api/v1/video/generate — premium', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireApiRole.mockResolvedValue({
      userId: 'user-123',
      organizationId: 'org-456',
      role: 'editor',
    })
    mockSingle.mockResolvedValue({
      data: {
        name: 'Cleanest Painting LLC',
        domain: 'cleanestpainting.com',
        branding: { primary: '#1B2B5B', secondary: '#fbbf24', accent: '#1e3a5f' },
        settings: null,
      },
      error: null,
    })
    mockEnqueuePremiumJob.mockResolvedValue('premium-org-456-1709820000000')
  })

  async function callRoute(body: Record<string, unknown>) {
    const { POST } = await import('@/app/api/v1/video/generate/route')
    const request = new Request('http://localhost/api/v1/video/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return POST(request)
  }

  it('routes premium_reel to premium queue with 202 response', async () => {
    const res = await callRoute({
      videoType: 'premium_reel',
      topic: 'Spring exterior painting transformation in Summit, NJ',
      style: 'cinematic',
      sceneCount: 3,
    })

    expect(res.status).toBe(202)
    const data = await res.json()
    expect(data.engine).toBe('premium')
    expect(data.jobId).toBe('premium-org-456-1709820000000')
    expect(data.status).toBe('queued')
  })

  it('passes all premium fields to enqueuePremiumJob', async () => {
    await callRoute({
      videoType: 'premium_reel',
      topic: 'Luxury bathroom renovation showcase',
      style: 'elegant',
      targetAudience: 'Affluent homeowners',
      sceneCount: 4,
      model: 'veo-3.1-generate-preview',
      includeIntro: true,
      includeOutro: false,
      ctaText: 'Book a Consultation',
      ctaUrl: 'cleanestpainting.com/consult',
      headingFont: 'Playfair Display',
      bodyFont: 'DM Sans',
    })

    expect(mockEnqueuePremiumJob).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: 'org-456',
        userId: 'user-123',
        topic: 'Luxury bathroom renovation showcase',
        style: 'elegant',
        targetAudience: 'Affluent homeowners',
        sceneCount: 4,
        model: 'veo-3.1-generate-preview',
        includeIntro: true,
        includeOutro: false,
        ctaText: 'Book a Consultation',
        ctaUrl: 'cleanestpainting.com/consult',
        headingFont: 'Playfair Display',
        bodyFont: 'DM Sans',
      }),
    )
  })

  it('returns 400 for invalid premium request (topic too short)', async () => {
    const res = await callRoute({
      videoType: 'premium_reel',
      topic: 'short',
      style: 'cinematic',
      sceneCount: 3,
    })

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Invalid request')
  })

  it('returns 400 for invalid sceneCount (> 5)', async () => {
    const res = await callRoute({
      videoType: 'premium_reel',
      topic: 'Valid topic that is long enough',
      style: 'cinematic',
      sceneCount: 10,
    })

    expect(res.status).toBe(400)
  })

  it('defaults model to veo-3.1-generate-preview (Standard)', async () => {
    await callRoute({
      videoType: 'premium_reel',
      topic: 'Spring exterior painting transformation in Summit, NJ',
      style: 'cinematic',
      sceneCount: 3,
    })

    expect(mockEnqueuePremiumJob).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'veo-3.1-generate-preview',
      }),
    )
  })

  it('defaults includeIntro and includeOutro to true', async () => {
    await callRoute({
      videoType: 'premium_reel',
      topic: 'Spring exterior painting transformation in Summit, NJ',
      style: 'cinematic',
      sceneCount: 3,
    })

    expect(mockEnqueuePremiumJob).toHaveBeenCalledWith(
      expect.objectContaining({
        includeIntro: true,
        includeOutro: true,
      }),
    )
  })
})
