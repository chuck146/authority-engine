import { describe, it, expect } from 'vitest'
import { rules, evaluateRule, stripHtml } from '../rules'
import type { SeoScorerInput } from '@/types/seo'
import { buildStructuredContent } from '@/tests/factories'

function makeInput(overrides?: Partial<SeoScorerInput>): SeoScorerInput {
  return {
    content: buildStructuredContent(),
    keywords: ['interior painting'],
    contentType: 'service_page',
    ...overrides,
  }
}

function getRule(id: string) {
  return rules.find((r) => r.id === id)!
}

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    expect(stripHtml('<p>Hello <strong>world</strong></p>')).toBe('Hello world')
  })

  it('handles empty string', () => {
    expect(stripHtml('')).toBe('')
  })

  it('handles plain text', () => {
    expect(stripHtml('no tags here')).toBe('no tags here')
  })
})

describe('meta-title-length', () => {
  const rule = getRule('meta-title-length')

  it('scores 100 for title 30–60 chars', () => {
    const input = makeInput({
      content: buildStructuredContent({ meta_title: 'Interior Painting | Cleanest Painting LLC' }),
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(100)
    expect(result.passed).toBe(true)
    expect(result.recommendation).toBeNull()
  })

  it('scores 0 for empty title', () => {
    const input = makeInput({
      content: buildStructuredContent({ meta_title: '' }),
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(0)
    expect(result.passed).toBe(false)
    expect(result.recommendation).toContain('Add a meta title')
  })

  it('scores proportionally for short title', () => {
    const input = makeInput({
      content: buildStructuredContent({ meta_title: 'Short' }), // 5 chars
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBeGreaterThan(0)
    expect(result.score).toBeLessThan(100)
    expect(result.recommendation).toContain('too short')
  })

  it('penalizes title over 60 chars', () => {
    const input = makeInput({
      content: buildStructuredContent({ meta_title: 'A'.repeat(70) }),
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBeLessThan(100)
    expect(result.recommendation).toContain('too long')
  })
})

describe('meta-description-length', () => {
  const rule = getRule('meta-description-length')

  it('scores 100 for description 120–160 chars', () => {
    const input = makeInput({
      content: buildStructuredContent({ meta_description: 'A'.repeat(140) }),
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(100)
    expect(result.passed).toBe(true)
  })

  it('scores 0 for empty description', () => {
    const input = makeInput({
      content: buildStructuredContent({ meta_description: '' }),
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(0)
    expect(result.recommendation).toContain('Add a meta description')
  })

  it('scores proportionally for short description', () => {
    const input = makeInput({
      content: buildStructuredContent({ meta_description: 'A'.repeat(60) }),
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(50)
    expect(result.recommendation).toContain('short')
  })
})

describe('heading-structure', () => {
  const rule = getRule('heading-structure')

  it('scores 100 for 3+ sections', () => {
    const input = makeInput({
      content: buildStructuredContent({
        sections: [
          { title: 'A', body: 'text' },
          { title: 'B', body: 'text' },
          { title: 'C', body: 'text' },
        ],
      }),
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(100)
  })

  it('scores 70 for 2 sections', () => {
    const result = evaluateRule(rule, makeInput())
    expect(result.score).toBe(70)
    expect(result.recommendation).toContain('Add more content sections')
  })

  it('scores 40 for 1 section', () => {
    const input = makeInput({
      content: buildStructuredContent({
        sections: [{ title: 'Only', body: 'text' }],
      }),
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(40)
  })

  it('deducts for empty titles', () => {
    const input = makeInput({
      content: buildStructuredContent({
        sections: [
          { title: '', body: 'text' },
          { title: 'B', body: 'text' },
          { title: 'C', body: 'text' },
        ],
      }),
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(85)
  })
})

describe('content-length', () => {
  const rule = getRule('content-length')

  it('scores 100 for service page with 300+ words', () => {
    const longBody = Array(100).fill('word word word').join(' ')
    const input = makeInput({
      content: buildStructuredContent({
        intro: longBody,
        sections: [{ title: 'S', body: longBody }],
        cta: 'Call us today for a free estimate.',
      }),
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(100)
  })

  it('uses 600-word target for blog posts', () => {
    const input = makeInput({
      content: buildStructuredContent({
        intro: 'Short.',
        sections: [{ title: 'S', body: 'Just a few words.' }],
        cta: 'Go.',
      }),
      contentType: 'blog_post',
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBeLessThan(100)
    expect(result.recommendation).toContain('600+')
  })

  it('scores proportionally for low word count', () => {
    const input = makeInput({
      content: buildStructuredContent({
        intro: 'Short.',
        sections: [{ title: 'S', body: 'Few words.' }],
        cta: 'Go.',
      }),
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBeGreaterThan(0)
    expect(result.score).toBeLessThan(100)
  })
})

describe('intro-present', () => {
  const rule = getRule('intro-present')

  it('scores 100 for intro >= 50 chars', () => {
    const input = makeInput({
      content: buildStructuredContent({ intro: 'A'.repeat(50) }),
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(100)
  })

  it('scores 60 for intro 20–49 chars', () => {
    const input = makeInput({
      content: buildStructuredContent({ intro: 'A'.repeat(30) }),
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(60)
  })

  it('scores 0 for empty intro', () => {
    const input = makeInput({
      content: buildStructuredContent({ intro: '' }),
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(0)
  })
})

describe('keyword-in-title', () => {
  const rule = getRule('keyword-in-title')

  it('scores 100 when keyword found in title', () => {
    const input = makeInput({
      content: buildStructuredContent({ meta_title: 'Interior Painting | Cleanest Painting' }),
      keywords: ['interior painting'],
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(100)
  })

  it('scores 0 when keyword not found', () => {
    const input = makeInput({
      content: buildStructuredContent({ meta_title: 'Our Services' }),
      keywords: ['interior painting'],
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(0)
    expect(result.recommendation).toContain('target keyword')
  })

  it('scores 50 when no keywords provided', () => {
    const input = makeInput({ keywords: [] })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(50)
    expect(result.recommendation).toContain('Add target keywords')
  })

  it('is case-insensitive', () => {
    const input = makeInput({
      content: buildStructuredContent({ meta_title: 'INTERIOR PAINTING Services' }),
      keywords: ['interior painting'],
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(100)
  })
})

describe('keyword-in-content', () => {
  const rule = getRule('keyword-in-content')

  it('scores 100 when keyword found in body', () => {
    const input = makeInput({
      content: buildStructuredContent({
        sections: [{ title: 'S', body: '<p>Our interior painting services are top-notch.</p>' }],
      }),
      keywords: ['interior painting'],
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(100)
  })

  it('scores 0 when keyword absent from body', () => {
    const input = makeInput({
      content: buildStructuredContent({
        intro: 'Welcome to our site.',
        sections: [{ title: 'S', body: '<p>We offer many services.</p>' }],
        cta: 'Contact us.',
      }),
      keywords: ['exterior staining'],
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(0)
  })
})

describe('keyword-density', () => {
  const rule = getRule('keyword-density')

  it('scores 50 when no keywords provided', () => {
    const input = makeInput({ keywords: [] })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(50)
  })

  it('scores 100 for 1–3% density', () => {
    // ~100 total words, "painting" appears 2 times → ~2% density for single-word keyword
    const filler = Array(45).fill('quality home service').join(' ')
    const input = makeInput({
      content: buildStructuredContent({
        intro: `painting ${filler}`,
        sections: [{ title: 'S', body: `<p>painting and more</p>` }],
        cta: 'Get a quote.',
      }),
      keywords: ['painting'],
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(100)
  })

  it('scores 50 for low density', () => {
    const words = Array(200).fill('word').join(' ')
    const input = makeInput({
      content: buildStructuredContent({
        intro: `interior painting ${words}`,
        sections: [{ title: 'S', body: `<p>${words}</p>` }],
        cta: 'Get a quote.',
      }),
      keywords: ['interior painting'],
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(50)
    expect(result.recommendation).toContain('low')
  })
})

describe('cta-present', () => {
  const rule = getRule('cta-present')

  it('scores 100 for CTA >= 10 chars', () => {
    const input = makeInput({
      content: buildStructuredContent({ cta: 'Get your free estimate today!' }),
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(100)
  })

  it('scores 50 for short CTA', () => {
    const input = makeInput({
      content: buildStructuredContent({ cta: 'Call us' }),
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(50)
  })

  it('scores 0 for empty CTA', () => {
    const input = makeInput({
      content: buildStructuredContent({ cta: '' }),
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(0)
    expect(result.recommendation).toContain('call to action')
  })
})

describe('paragraph-length', () => {
  const rule = getRule('paragraph-length')

  it('scores 100 for avg 2–6 sentences per section', () => {
    const input = makeInput({
      content: buildStructuredContent({
        sections: [
          { title: 'A', body: '<p>Sentence one. Sentence two. Sentence three.</p>' },
          { title: 'B', body: '<p>First. Second. Third. Fourth.</p>' },
        ],
      }),
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(100)
  })

  it('scores 60 for very short sections', () => {
    const input = makeInput({
      content: buildStructuredContent({
        sections: [
          { title: 'A', body: 'One.' },
          { title: 'B', body: 'Two.' },
        ],
      }),
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(60)
    expect(result.recommendation).toContain('very short')
  })

  it('scores 0 when no sections', () => {
    // This can't happen with our Zod schema (min 1), but test the function
    const input = makeInput({
      content: {
        ...buildStructuredContent(),
        sections: [],
      } as SeoScorerInput['content'],
    })
    const result = evaluateRule(rule, input)
    expect(result.score).toBe(0)
  })
})

describe('evaluateRule', () => {
  it('clamps score to 0–100', () => {
    // All default content should produce valid scores
    const input = makeInput()
    for (const rule of rules) {
      const result = evaluateRule(rule, input)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    }
  })

  it('all rules have correct weights summing to 100', () => {
    const totalWeight = rules.reduce((sum, r) => sum + r.weight, 0)
    expect(totalWeight).toBe(100)
  })
})
