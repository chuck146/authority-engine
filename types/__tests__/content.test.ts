import { describe, it, expect } from 'vitest'
import {
  structuredContentSchema,
  servicePageInputSchema,
  locationPageInputSchema,
  blogPostInputSchema,
  generateContentRequestSchema,
} from '../content'
import { buildStructuredContent } from '@/tests/factories'

describe('structuredContentSchema', () => {
  it('accepts a valid object', () => {
    const result = structuredContentSchema.safeParse(buildStructuredContent())
    expect(result.success).toBe(true)
  })

  it('rejects missing headline', () => {
    const content = buildStructuredContent()
    const { headline, ...rest } = content
    expect(headline).toBeDefined()
    const result = structuredContentSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects meta_title > 60 chars', () => {
    const result = structuredContentSchema.safeParse(
      buildStructuredContent({ meta_title: 'a'.repeat(61) }),
    )
    expect(result.success).toBe(false)
  })

  it('rejects meta_description > 160 chars', () => {
    const result = structuredContentSchema.safeParse(
      buildStructuredContent({ meta_description: 'a'.repeat(161) }),
    )
    expect(result.success).toBe(false)
  })

  it('rejects empty sections array', () => {
    const result = structuredContentSchema.safeParse(buildStructuredContent({ sections: [] }))
    expect(result.success).toBe(false)
  })
})

describe('servicePageInputSchema', () => {
  it('accepts valid input with defaults', () => {
    const result = servicePageInputSchema.safeParse({
      contentType: 'service_page',
      serviceName: 'Interior Painting',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tone).toBe('professional')
    }
  })

  it('rejects serviceName < 2 chars', () => {
    const result = servicePageInputSchema.safeParse({
      contentType: 'service_page',
      serviceName: 'X',
    })
    expect(result.success).toBe(false)
  })

  it('treats empty serviceDescription as omitted', () => {
    const result = servicePageInputSchema.safeParse({
      contentType: 'service_page',
      serviceName: 'Interior Painting',
      serviceDescription: '',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.serviceDescription).toBeUndefined()
    }
  })

  it('accepts optional serviceDescription and targetKeywords', () => {
    const result = servicePageInputSchema.safeParse({
      contentType: 'service_page',
      serviceName: 'Painting',
      serviceDescription: 'Full interior painting including walls, ceilings, trim.',
      targetKeywords: ['interior painting', 'house painter'],
    })
    expect(result.success).toBe(true)
  })
})

describe('locationPageInputSchema', () => {
  it('accepts valid input', () => {
    const result = locationPageInputSchema.safeParse({
      contentType: 'location_page',
      city: 'Summit',
      state: 'NJ',
      serviceName: 'Painting',
    })
    expect(result.success).toBe(true)
  })

  it('rejects state that is not exactly 2 chars', () => {
    const result = locationPageInputSchema.safeParse({
      contentType: 'location_page',
      city: 'Summit',
      state: 'New Jersey',
      serviceName: 'Painting',
    })
    expect(result.success).toBe(false)
  })

  it('rejects single-char state', () => {
    const result = locationPageInputSchema.safeParse({
      contentType: 'location_page',
      city: 'Summit',
      state: 'N',
      serviceName: 'Painting',
    })
    expect(result.success).toBe(false)
  })
})

describe('blogPostInputSchema', () => {
  it('defaults tone to friendly', () => {
    const result = blogPostInputSchema.safeParse({
      contentType: 'blog_post',
      topic: 'How to Choose Paint Colors',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tone).toBe('friendly')
    }
  })

  it('defaults targetWordCount to 800', () => {
    const result = blogPostInputSchema.safeParse({
      contentType: 'blog_post',
      topic: 'How to Choose Paint Colors',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.targetWordCount).toBe(800)
    }
  })

  it('rejects targetWordCount below 300', () => {
    const result = blogPostInputSchema.safeParse({
      contentType: 'blog_post',
      topic: 'How to Choose Paint Colors',
      targetWordCount: 100,
    })
    expect(result.success).toBe(false)
  })

  it('rejects targetWordCount above 3000', () => {
    const result = blogPostInputSchema.safeParse({
      contentType: 'blog_post',
      topic: 'How to Choose Paint Colors',
      targetWordCount: 5000,
    })
    expect(result.success).toBe(false)
  })

  it('accepts optional category', () => {
    const result = blogPostInputSchema.safeParse({
      contentType: 'blog_post',
      topic: 'How to Choose Paint Colors',
      category: 'Tips & Guides',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.category).toBe('Tips & Guides')
    }
  })
})

describe('generateContentRequestSchema (discriminated union)', () => {
  it('routes to service_page schema', () => {
    const result = generateContentRequestSchema.safeParse({
      contentType: 'service_page',
      serviceName: 'Interior Painting',
    })
    expect(result.success).toBe(true)
  })

  it('routes to location_page schema', () => {
    const result = generateContentRequestSchema.safeParse({
      contentType: 'location_page',
      city: 'Summit',
      state: 'NJ',
      serviceName: 'Painting',
    })
    expect(result.success).toBe(true)
  })

  it('routes to blog_post schema', () => {
    const result = generateContentRequestSchema.safeParse({
      contentType: 'blog_post',
      topic: 'Color trends for 2026',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid contentType', () => {
    const result = generateContentRequestSchema.safeParse({
      contentType: 'newsletter',
      topic: 'test',
    })
    expect(result.success).toBe(false)
  })
})
