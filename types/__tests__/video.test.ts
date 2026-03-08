import { describe, it, expect } from 'vitest'
import {
  generateVideoRequestSchema,
  videoTypeSchema,
  veoModelSchema,
  aspectRatioSchema,
  cinematicReelInputSchema,
  projectShowcaseInputSchema,
  testimonialSceneInputSchema,
  brandStoryInputSchema,
} from '@/types/video'

describe('videoTypeSchema', () => {
  it('accepts valid video types', () => {
    expect(videoTypeSchema.parse('cinematic_reel')).toBe('cinematic_reel')
    expect(videoTypeSchema.parse('project_showcase')).toBe('project_showcase')
    expect(videoTypeSchema.parse('testimonial_scene')).toBe('testimonial_scene')
    expect(videoTypeSchema.parse('brand_story')).toBe('brand_story')
  })

  it('rejects invalid video types', () => {
    expect(() => videoTypeSchema.parse('invalid')).toThrow()
  })
})

describe('veoModelSchema', () => {
  it('defaults to fast model', () => {
    expect(veoModelSchema.parse(undefined)).toBe('veo-3.1-fast-generate-preview')
  })

  it('accepts standard model', () => {
    expect(veoModelSchema.parse('veo-3.1-generate-preview')).toBe('veo-3.1-generate-preview')
  })

  it('rejects invalid model', () => {
    expect(() => veoModelSchema.parse('gpt-4')).toThrow()
  })
})

describe('aspectRatioSchema', () => {
  it('defaults to 9:16', () => {
    expect(aspectRatioSchema.parse(undefined)).toBe('9:16')
  })

  it('accepts all valid ratios', () => {
    expect(aspectRatioSchema.parse('9:16')).toBe('9:16')
    expect(aspectRatioSchema.parse('1:1')).toBe('1:1')
    expect(aspectRatioSchema.parse('16:9')).toBe('16:9')
  })
})

describe('cinematicReelInputSchema', () => {
  it('validates valid input', () => {
    const result = cinematicReelInputSchema.safeParse({
      videoType: 'cinematic_reel',
      sceneDescription: 'A beautifully painted living room',
      audioMood: 'Warm orchestral',
    })
    expect(result.success).toBe(true)
  })

  it('rejects short scene description', () => {
    const result = cinematicReelInputSchema.safeParse({
      videoType: 'cinematic_reel',
      sceneDescription: 'short',
      audioMood: 'Warm orchestral',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing audioMood', () => {
    const result = cinematicReelInputSchema.safeParse({
      videoType: 'cinematic_reel',
      sceneDescription: 'A beautifully painted living room',
    })
    expect(result.success).toBe(false)
  })
})

describe('projectShowcaseInputSchema', () => {
  it('validates valid input', () => {
    const result = projectShowcaseInputSchema.safeParse({
      videoType: 'project_showcase',
      beforeDescription: 'Old peeling paint on walls',
      afterDescription: 'Fresh Benjamin Moore paint',
      location: 'Summit, NJ',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing location', () => {
    const result = projectShowcaseInputSchema.safeParse({
      videoType: 'project_showcase',
      beforeDescription: 'Old peeling paint on walls',
      afterDescription: 'Fresh Benjamin Moore paint',
    })
    expect(result.success).toBe(false)
  })
})

describe('testimonialSceneInputSchema', () => {
  it('validates valid input', () => {
    const result = testimonialSceneInputSchema.safeParse({
      videoType: 'testimonial_scene',
      quote: 'Excellent work, truly professional team!',
      customerName: 'John Smith',
    })
    expect(result.success).toBe(true)
  })

  it('defaults sentiment to positive', () => {
    const result = testimonialSceneInputSchema.parse({
      videoType: 'testimonial_scene',
      quote: 'Excellent work, truly professional team!',
      customerName: 'John Smith',
    })
    expect(result.sentiment).toBe('positive')
  })

  it('rejects short quote', () => {
    const result = testimonialSceneInputSchema.safeParse({
      videoType: 'testimonial_scene',
      quote: 'Good',
      customerName: 'John',
    })
    expect(result.success).toBe(false)
  })
})

describe('brandStoryInputSchema', () => {
  it('validates valid input', () => {
    const result = brandStoryInputSchema.safeParse({
      videoType: 'brand_story',
      narrative: 'The story of how we built our company from the ground up',
    })
    expect(result.success).toBe(true)
  })

  it('defaults style to cinematic', () => {
    const result = brandStoryInputSchema.parse({
      videoType: 'brand_story',
      narrative: 'The story of how we built our company from the ground up',
    })
    expect(result.style).toBe('cinematic')
  })
})

describe('generateVideoRequestSchema (discriminated union)', () => {
  it('parses cinematic_reel correctly', () => {
    const result = generateVideoRequestSchema.safeParse({
      videoType: 'cinematic_reel',
      sceneDescription: 'A beautifully painted living room',
      audioMood: 'Warm orchestral',
      aspectRatio: '16:9',
      model: 'veo-3.1-generate-preview',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.videoType).toBe('cinematic_reel')
    }
  })

  it('parses project_showcase correctly', () => {
    const result = generateVideoRequestSchema.safeParse({
      videoType: 'project_showcase',
      beforeDescription: 'Old peeling paint on walls',
      afterDescription: 'Fresh Benjamin Moore paint',
      location: 'Summit, NJ',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid videoType', () => {
    const result = generateVideoRequestSchema.safeParse({
      videoType: 'invalid_type',
      sceneDescription: 'Test',
    })
    expect(result.success).toBe(false)
  })

  it('rejects mismatched fields', () => {
    const result = generateVideoRequestSchema.safeParse({
      videoType: 'cinematic_reel',
      // Missing sceneDescription and audioMood
      beforeDescription: 'This is for project_showcase',
    })
    expect(result.success).toBe(false)
  })
})
