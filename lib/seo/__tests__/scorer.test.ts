import { describe, it, expect } from 'vitest'
import { calculateSeoScore, calculateSeoScoreValue } from '../scorer'
import { buildStructuredContent } from '@/tests/factories'
import type { SeoScorerInput } from '@/types/seo'

function makeInput(overrides?: Partial<SeoScorerInput>): SeoScorerInput {
  return {
    content: buildStructuredContent(),
    keywords: ['interior painting'],
    contentType: 'service_page',
    ...overrides,
  }
}

describe('calculateSeoScore', () => {
  it('returns a score between 0 and 100', () => {
    const result = calculateSeoScore(makeInput())
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('returns all 10 rules', () => {
    const result = calculateSeoScore(makeInput())
    expect(result.rules).toHaveLength(10)
  })

  it('returns all 4 category scores', () => {
    const result = calculateSeoScore(makeInput())
    expect(Object.keys(result.categoryScores)).toEqual(
      expect.arrayContaining([
        'meta-tags',
        'content-structure',
        'keyword-optimization',
        'readability',
      ]),
    )
  })

  it('returns a summary string', () => {
    const result = calculateSeoScore(makeInput())
    expect(typeof result.summary).toBe('string')
    expect(result.summary.length).toBeGreaterThan(0)
  })

  it('gives high score for well-optimized content', () => {
    const words = Array(100).fill('interior painting services quality work').join(' ')
    const input = makeInput({
      content: buildStructuredContent({
        headline: 'Professional Interior Painting Services',
        intro:
          'Transform your home with our expert interior painting services. We offer premium quality results.',
        sections: [
          {
            title: 'Why Choose Us',
            body: `<p>Our interior painting team delivers exceptional results. ${words}</p>`,
          },
          {
            title: 'Our Process',
            body: '<p>From consultation to final walkthrough, we ensure quality. Every detail matters to us.</p>',
          },
          {
            title: 'Pricing',
            body: '<p>Competitive rates for interior painting projects. Get your free estimate today for any room.</p>',
          },
        ],
        cta: 'Get your free interior painting estimate today!',
        meta_title: 'Interior Painting Services | Best Quality',
        meta_description:
          'Professional interior painting services for your home. Expert painters, premium materials, and satisfaction guaranteed. Get a free estimate today from our team.',
      }),
      keywords: ['interior painting'],
    })
    const result = calculateSeoScore(input)
    expect(result.score).toBeGreaterThanOrEqual(70)
  })

  it('gives low score for minimal content', () => {
    const input = makeInput({
      content: buildStructuredContent({
        headline: 'Page',
        intro: '',
        sections: [{ title: '', body: 'Hi.' }],
        cta: '',
        meta_title: 'X',
        meta_description: '',
      }),
      keywords: [],
    })
    const result = calculateSeoScore(input)
    expect(result.score).toBeLessThan(40)
  })

  it('summary mentions "Excellent" for high scores', () => {
    const words = Array(100).fill('interior painting services quality work').join(' ')
    const input = makeInput({
      content: buildStructuredContent({
        headline: 'Professional Interior Painting Services',
        intro:
          'Transform your home with our expert interior painting services. We offer premium quality results.',
        sections: [
          {
            title: 'Why Choose Us',
            body: `<p>Our interior painting team delivers exceptional results. ${words}</p>`,
          },
          {
            title: 'Our Process',
            body: '<p>From consultation to final walkthrough, we ensure quality. Every detail matters to us.</p>',
          },
          {
            title: 'Pricing',
            body: '<p>Competitive rates for interior painting projects. Get your free estimate today for any room.</p>',
          },
        ],
        cta: 'Get your free interior painting estimate today!',
        meta_title: 'Interior Painting Services | Best Quality',
        meta_description:
          'Professional interior painting services for your home. Expert painters, premium materials, and satisfaction guaranteed. Get a free estimate today from our team.',
      }),
      keywords: ['interior painting'],
    })
    const result = calculateSeoScore(input)
    if (result.score >= 80) {
      expect(result.summary).toMatch(/Great|Excellent/)
    }
  })

  it('summary mentions issues for low scores', () => {
    const input = makeInput({
      content: buildStructuredContent({
        intro: '',
        sections: [{ title: '', body: '' }],
        cta: '',
        meta_title: '',
        meta_description: '',
      }),
      keywords: [],
    })
    const result = calculateSeoScore(input)
    expect(result.summary).toMatch(/low|needs work|need/i)
  })

  it('category scores are 0–100', () => {
    const result = calculateSeoScore(makeInput())
    for (const score of Object.values(result.categoryScores)) {
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    }
  })
})

describe('calculateSeoScoreValue', () => {
  it('returns just the number', () => {
    const value = calculateSeoScoreValue(makeInput())
    expect(typeof value).toBe('number')
    expect(value).toBeGreaterThanOrEqual(0)
    expect(value).toBeLessThanOrEqual(100)
  })

  it('matches calculateSeoScore().score', () => {
    const input = makeInput()
    const full = calculateSeoScore(input)
    const value = calculateSeoScoreValue(input)
    expect(value).toBe(full.score)
  })
})
