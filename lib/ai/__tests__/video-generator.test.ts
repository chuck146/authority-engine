import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildOrgContext } from '@/tests/factories'
import type {
  CinematicReelInput,
  ProjectShowcaseInput,
  TestimonialSceneInput,
  BrandStoryInput,
} from '@/types/video'

const mockGenerateVideo = vi.fn()
const mockGenerateStartingFrame = vi.fn()
const mockUploadVideo = vi.fn()
const mockCreateAdminClient = vi.fn()
const mockSingle = vi.fn()
const mockSelect = vi.fn(() => ({ single: mockSingle }))
const mockInsert = vi.fn(() => ({ select: mockSelect }))

vi.mock('@/lib/ai/veo', () => ({
  generateVideo: (...args: unknown[]) => mockGenerateVideo(...args),
  generateStartingFrame: (...args: unknown[]) => mockGenerateStartingFrame(...args),
}))

vi.mock('@/lib/storage/supabase-storage', () => ({
  uploadVideo: (...args: unknown[]) => mockUploadVideo(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockCreateAdminClient(),
}))

const { generateAndStoreVideo } = await import('../video-generator')

function setupMocks() {
  mockGenerateVideo.mockResolvedValue({
    videoData: Buffer.from('video-content'),
    mimeType: 'video/mp4',
    durationSeconds: 8,
    promptUsed: 'Test prompt',
  })

  mockGenerateStartingFrame.mockResolvedValue({
    imageData: Buffer.from('image-content'),
    mimeType: 'image/png',
    promptUsed: 'Starting frame prompt',
  })

  mockUploadVideo.mockResolvedValue({
    storagePath: 'org-456/videos/cinematic_reel/abc.mp4',
    publicUrl:
      'https://example.supabase.co/storage/v1/object/public/media/org-456/videos/cinematic_reel/abc.mp4',
    sizeBytes: 5242880,
  })

  mockSingle.mockResolvedValue({
    data: { id: 'video-1' },
    error: null,
  })

  mockCreateAdminClient.mockReturnValue({
    from: vi.fn(() => ({ insert: mockInsert })),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  setupMocks()
})

describe('generateAndStoreVideo', () => {
  it('generates cinematic_reel with starting frame', async () => {
    const input: CinematicReelInput = {
      videoType: 'cinematic_reel',
      sceneDescription: 'A beautifully painted living room',
      audioMood: 'Warm orchestral strings',
      aspectRatio: '9:16',
      model: 'veo-3.1-fast-generate-preview',
    }

    const result = await generateAndStoreVideo(input, buildOrgContext(), 'org-456', 'user-123')

    expect(mockGenerateStartingFrame).toHaveBeenCalledOnce()
    expect(mockGenerateVideo).toHaveBeenCalledOnce()
    expect(mockUploadVideo).toHaveBeenCalledWith(
      'org-456',
      'cinematic_reel',
      expect.any(Buffer),
      'video/mp4',
    )
    expect(result.id).toBe('video-1')
    expect(result.videoType).toBe('cinematic_reel')
    expect(result.durationSeconds).toBe(8)
  })

  it('generates project_showcase with starting frame', async () => {
    const input: ProjectShowcaseInput = {
      videoType: 'project_showcase',
      beforeDescription: 'Old peeling paint on walls',
      afterDescription: 'Fresh Benjamin Moore paint job',
      location: 'Summit, NJ',
      model: 'veo-3.1-fast-generate-preview',
    }

    await generateAndStoreVideo(input, buildOrgContext(), 'org-456', 'user-123')

    expect(mockGenerateStartingFrame).toHaveBeenCalledOnce()
    expect(mockGenerateVideo).toHaveBeenCalledOnce()
  })

  it('generates testimonial_scene without starting frame', async () => {
    const input: TestimonialSceneInput = {
      videoType: 'testimonial_scene',
      quote: 'Excellent work, professional team!',
      customerName: 'John Smith',
      sentiment: 'positive',
      model: 'veo-3.1-fast-generate-preview',
    }

    await generateAndStoreVideo(input, buildOrgContext(), 'org-456', 'user-123')

    expect(mockGenerateStartingFrame).not.toHaveBeenCalled()
    expect(mockGenerateVideo).toHaveBeenCalledOnce()
  })

  it('generates brand_story without starting frame', async () => {
    const input: BrandStoryInput = {
      videoType: 'brand_story',
      narrative: 'From a small shop to the premier painting company',
      style: 'documentary',
      model: 'veo-3.1-fast-generate-preview',
    }

    await generateAndStoreVideo(input, buildOrgContext(), 'org-456', 'user-123')

    expect(mockGenerateStartingFrame).not.toHaveBeenCalled()
    expect(mockGenerateVideo).toHaveBeenCalledOnce()
  })

  it('passes correct model to Veo', async () => {
    const input: CinematicReelInput = {
      videoType: 'cinematic_reel',
      sceneDescription: 'A high-end kitchen renovation',
      audioMood: 'Dramatic reveal music',
      aspectRatio: '9:16',
      model: 'veo-3.1-generate-preview',
    }

    await generateAndStoreVideo(input, buildOrgContext(), 'org-456', 'user-123')

    expect(mockGenerateVideo).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'veo-3.1-generate-preview' }),
    )
  })

  it('builds correct filename for each type', async () => {
    const input: TestimonialSceneInput = {
      videoType: 'testimonial_scene',
      quote: 'Best painters in New Jersey!',
      customerName: 'Sarah Johnson',
      sentiment: 'impressed',
      model: 'veo-3.1-fast-generate-preview',
    }

    const result = await generateAndStoreVideo(input, buildOrgContext(), 'org-456', 'user-123')

    expect(result.filename).toContain('testimonial-sarah-johnson')
    expect(result.filename.endsWith('.mp4')).toBe(true)
  })

  it('throws on storage upload failure', async () => {
    mockUploadVideo.mockRejectedValue(new Error('Storage upload failed'))

    const input: CinematicReelInput = {
      videoType: 'cinematic_reel',
      sceneDescription: 'A test scene for error handling',
      audioMood: 'Test mood',
      aspectRatio: '9:16',
      model: 'veo-3.1-fast-generate-preview',
    }

    await expect(
      generateAndStoreVideo(input, buildOrgContext(), 'org-456', 'user-123'),
    ).rejects.toThrow('Storage upload failed')
  })

  it('throws on database insert failure', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } })

    const input: CinematicReelInput = {
      videoType: 'cinematic_reel',
      sceneDescription: 'A test scene for error handling',
      audioMood: 'Test mood',
      aspectRatio: '9:16',
      model: 'veo-3.1-fast-generate-preview',
    }

    await expect(
      generateAndStoreVideo(input, buildOrgContext(), 'org-456', 'user-123'),
    ).rejects.toThrow()
  })
})
