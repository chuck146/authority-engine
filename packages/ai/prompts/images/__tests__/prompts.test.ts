import { describe, it, expect } from 'vitest'
import { buildBlogThumbnailPrompt } from '../blog-thumbnail'
import { buildLocationHeroPrompt } from '../location-hero'
import { buildSocialGraphicPrompt } from '../social-graphic'
import { IMAGE_DIMENSIONS, buildBrandColorInstruction, buildCompanyContext } from '../shared'
import { buildOrgContext } from '@/tests/factories'

const org = buildOrgContext()
const orgNoBranding = buildOrgContext({ branding: null })

describe('shared', () => {
  it('IMAGE_DIMENSIONS has all 3 types', () => {
    expect(IMAGE_DIMENSIONS.blog_thumbnail).toEqual({ width: 1200, height: 630 })
    expect(IMAGE_DIMENSIONS.location_hero).toEqual({ width: 1920, height: 1080 })
    expect(IMAGE_DIMENSIONS.social_graphic).toEqual({ width: 1080, height: 1080 })
  })

  it('buildBrandColorInstruction includes brand colors', () => {
    const result = buildBrandColorInstruction(org)
    expect(result).toContain('#1a472a')
    expect(result).toContain('#fbbf24')
    expect(result).toContain('#1e3a5f')
  })

  it('buildBrandColorInstruction returns empty for null branding', () => {
    expect(buildBrandColorInstruction(orgNoBranding)).toBe('')
  })

  it('buildCompanyContext includes org name and tagline', () => {
    const result = buildCompanyContext(org)
    expect(result).toContain('Cleanest Painting LLC')
    expect(result).toContain('Where Artistry Meets Craftsmanship')
  })
})

describe('buildBlogThumbnailPrompt', () => {
  it('includes topic and dimensions', () => {
    const prompt = buildBlogThumbnailPrompt(
      { imageType: 'blog_thumbnail', topic: 'Paint Colors', style: 'photorealistic', mood: 'warm' },
      org,
    )
    expect(prompt).toContain('Paint Colors')
    expect(prompt).toContain('1200x630')
    expect(prompt).toContain('blog thumbnail')
  })

  it('includes brand colors from org context', () => {
    const prompt = buildBlogThumbnailPrompt(
      { imageType: 'blog_thumbnail', topic: 'Colors', style: 'photorealistic', mood: 'warm' },
      org,
    )
    expect(prompt).toContain('#1a472a')
  })

  it('works without branding', () => {
    const prompt = buildBlogThumbnailPrompt(
      { imageType: 'blog_thumbnail', topic: 'Colors', style: 'illustration', mood: 'cool' },
      orgNoBranding,
    )
    expect(prompt).toContain('Colors')
    expect(prompt).toContain('illustration')
    expect(prompt).not.toContain('#1a472a')
  })
})

describe('buildLocationHeroPrompt', () => {
  it('includes city, state, and service', () => {
    const prompt = buildLocationHeroPrompt(
      {
        imageType: 'location_hero',
        city: 'Summit',
        state: 'NJ',
        serviceName: 'Interior Painting',
        style: 'photorealistic',
      },
      org,
    )
    expect(prompt).toContain('Summit')
    expect(prompt).toContain('NJ')
    expect(prompt).toContain('Interior Painting')
    expect(prompt).toContain('1920x1080')
  })

  it('includes brand colors', () => {
    const prompt = buildLocationHeroPrompt(
      {
        imageType: 'location_hero',
        city: 'Summit',
        state: 'NJ',
        serviceName: 'Painting',
        style: 'photorealistic',
      },
      org,
    )
    expect(prompt).toContain('#1a472a')
  })
})

describe('buildSocialGraphicPrompt', () => {
  it('includes message and dimensions', () => {
    const prompt = buildSocialGraphicPrompt(
      {
        imageType: 'social_graphic',
        message: 'Spring sale 15% off!',
        style: 'flat',
        mood: 'vibrant',
      },
      org,
    )
    expect(prompt).toContain('Spring sale 15% off!')
    expect(prompt).toContain('1080x1080')
    expect(prompt).toContain('flat')
    expect(prompt).toContain('vibrant')
  })

  it('includes brand colors', () => {
    const prompt = buildSocialGraphicPrompt(
      { imageType: 'social_graphic', message: 'Test', style: 'photorealistic', mood: 'warm' },
      org,
    )
    expect(prompt).toContain('#1a472a')
  })
})
