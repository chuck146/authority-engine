import { describe, it, expect } from 'vitest'
import { buildCinematicReelPrompt } from '../cinematic-reel'
import { buildProjectShowcasePrompt } from '../project-showcase'
import { buildTestimonialScenePrompt } from '../testimonial-scene'
import { buildBrandStoryPrompt } from '../brand-story'
import { formatVeoPrompt } from '../shared'
import { buildOrgContext } from '@/tests/factories'
import type {
  CinematicReelInput,
  ProjectShowcaseInput,
  TestimonialSceneInput,
  BrandStoryInput,
} from '@/types/video'

describe('buildCinematicReelPrompt', () => {
  it('includes scene description and company context', () => {
    const input: CinematicReelInput = {
      videoType: 'cinematic_reel',
      sceneDescription: 'Freshly painted living room with warm lighting',
      audioMood: 'Soft orchestral strings',
      aspectRatio: '9:16',
      model: 'veo-3.1-fast-generate-preview',
    }
    const result = buildCinematicReelPrompt(input, buildOrgContext())
    expect(result.visual).toContain('Freshly painted living room')
    expect(result.visual).toContain('Cleanest Painting LLC')
    expect(result.audio).toContain('Soft orchestral strings')
  })

  it('includes brand tagline when present', () => {
    const input: CinematicReelInput = {
      videoType: 'cinematic_reel',
      sceneDescription: 'A beautiful home exterior',
      audioMood: 'Uplifting music',
      aspectRatio: '9:16',
      model: 'veo-3.1-fast-generate-preview',
    }
    const result = buildCinematicReelPrompt(input, buildOrgContext())
    expect(result.visual).toContain('Where Artistry Meets Craftsmanship')
  })

  it('includes brand colors when branding exists', () => {
    const input: CinematicReelInput = {
      videoType: 'cinematic_reel',
      sceneDescription: 'A beautiful home exterior',
      audioMood: 'Uplifting music',
      aspectRatio: '9:16',
      model: 'veo-3.1-fast-generate-preview',
    }
    const result = buildCinematicReelPrompt(input, buildOrgContext())
    expect(result.visual).toContain('#1a472a')
  })

  it('skips brand colors when no branding', () => {
    const input: CinematicReelInput = {
      videoType: 'cinematic_reel',
      sceneDescription: 'A beautiful home exterior',
      audioMood: 'Uplifting music',
      aspectRatio: '9:16',
      model: 'veo-3.1-fast-generate-preview',
    }
    const result = buildCinematicReelPrompt(input, buildOrgContext({ branding: null }))
    expect(result.visual).not.toContain('#1a472a')
  })
})

describe('buildProjectShowcasePrompt', () => {
  it('includes before/after and location', () => {
    const input: ProjectShowcaseInput = {
      videoType: 'project_showcase',
      beforeDescription: 'Peeling paint on exterior walls',
      afterDescription: 'Fresh Sherwin-Williams paint job',
      location: 'Summit, NJ',
      model: 'veo-3.1-fast-generate-preview',
    }
    const result = buildProjectShowcasePrompt(input, buildOrgContext())
    expect(result.visual).toContain('Before: Peeling paint')
    expect(result.visual).toContain('after: Fresh Sherwin-Williams')
    expect(result.visual).toContain('Summit, NJ')
    expect(result.audio).toBeDefined()
  })
})

describe('buildTestimonialScenePrompt', () => {
  it('includes quote and customer name', () => {
    const input: TestimonialSceneInput = {
      videoType: 'testimonial_scene',
      quote: 'Best painting service we ever hired!',
      customerName: 'Sarah Johnson',
      sentiment: 'impressed',
      model: 'veo-3.1-fast-generate-preview',
    }
    const result = buildTestimonialScenePrompt(input, buildOrgContext())
    expect(result.visual).toContain('Best painting service')
    expect(result.visual).toContain('Sarah Johnson')
    expect(result.visual).toContain('dramatic, polished')
  })

  it('uses warm mood for positive sentiment', () => {
    const input: TestimonialSceneInput = {
      videoType: 'testimonial_scene',
      quote: 'Great work on our kitchen!',
      customerName: 'Tom',
      sentiment: 'positive',
      model: 'veo-3.1-fast-generate-preview',
    }
    const result = buildTestimonialScenePrompt(input, buildOrgContext())
    expect(result.visual).toContain('warm, bright')
  })
})

describe('buildBrandStoryPrompt', () => {
  it('includes narrative and style', () => {
    const input: BrandStoryInput = {
      videoType: 'brand_story',
      narrative: 'From a small local shop to the premier painting company',
      style: 'documentary',
      model: 'veo-3.1-fast-generate-preview',
    }
    const result = buildBrandStoryPrompt(input, buildOrgContext())
    expect(result.visual).toContain('small local shop')
    expect(result.visual).toContain('Documentary-style')
    expect(result.audio).toBeDefined()
  })

  it('uses cinematic style by default', () => {
    const input: BrandStoryInput = {
      videoType: 'brand_story',
      narrative: 'Our journey in the painting industry',
      style: 'cinematic',
      model: 'veo-3.1-fast-generate-preview',
    }
    const result = buildBrandStoryPrompt(input, buildOrgContext())
    expect(result.visual).toContain('Cinematic wide shots')
  })
})

describe('formatVeoPrompt', () => {
  it('formats visual and audio into Veo prompt format', () => {
    const result = formatVeoPrompt('A beautiful scene', 'Soft piano melody')
    expect(result).toBe('Visual: A beautiful scene\n\nAudio: Soft piano melody')
  })
})
