import { describe, it, expect } from 'vitest'
import {
  buildAttribution,
  classifyChannel,
  leadSourceForChannel,
  attributionSchema,
  storedChannel,
} from '@/lib/leads/attribution'

const SITE = 'cleanestpaintingnj.com'

describe('classifyChannel', () => {
  it.each([
    [{ referrer_host: 'chatgpt.com' }, 'ai_assistant'],
    [{ referrer_host: 'www.perplexity.ai' }, 'ai_assistant'],
    [{ referrer_host: 'gemini.google.com' }, 'ai_assistant'],
    [{ utm_source: 'chatgpt.com' }, 'ai_assistant'],
    [{ referrer_host: 'www.google.com', gclid: true }, 'paid_search'],
    [{ utm_source: 'google', utm_medium: 'cpc' }, 'paid_search'],
    [{ utm_source: 'gbp', utm_medium: 'organic' }, 'google_business_profile'],
    [{ referrer_host: 'maps.google.com' }, 'google_business_profile'],
    [{ referrer_host: 'www.google.com' }, 'organic_search'],
    [{ referrer_host: 'bing.com' }, 'organic_search'],
    [{ referrer_host: 'l.facebook.com' }, 'social'],
    [{ referrer_host: 'nextdoor.com' }, 'social'],
    [{ utm_medium: 'email' }, 'email'],
    [{ referrer_host: 'angi.com' }, 'referral'],
    [{ referrer_host: 'cleanestpaintingnj.com' }, 'direct'],
    [{}, 'direct'],
  ] as const)('%o → %s', (attribution, expected) => {
    expect(classifyChannel(attribution, SITE)).toBe(expected)
  })

  it('treats missing attribution as direct', () => {
    expect(classifyChannel(undefined, SITE)).toBe('direct')
  })
})

describe('buildAttribution', () => {
  it('keeps only the landing path, referrer host, and UTM tags', () => {
    const a = buildAttribution({
      href: 'https://cleanestpaintingnj.com/services/interior-painting?utm_source=chatgpt.com&email=jane@example.com',
      referrer: 'https://chatgpt.com/c/abc123?q=painters+near+me',
      now: new Date('2026-10-19T12:00:00Z'),
    })
    expect(a).toEqual({
      landing_page: '/services/interior-painting',
      referrer_host: 'chatgpt.com',
      utm_source: 'chatgpt.com',
      first_seen_at: '2026-10-19T12:00:00.000Z',
    })
    expect(JSON.stringify(a)).not.toContain('jane@example.com')
    expect(JSON.stringify(a)).not.toContain('abc123')
  })

  it('ignores internal referrers and flags gclid without storing it', () => {
    const a = buildAttribution({
      href: 'https://cleanestpaintingnj.com/?gclid=XYZ',
      referrer: 'https://www.cleanestpaintingnj.com/blog',
    })
    expect(a.referrer_host).toBeUndefined()
    expect(a.gclid).toBe(true)
    expect(JSON.stringify(a)).not.toContain('XYZ')
  })

  it('tolerates a malformed referrer', () => {
    const a = buildAttribution({ href: 'https://cleanestpaintingnj.com/', referrer: 'not a url' })
    expect(a.referrer_host).toBeUndefined()
  })
})

describe('attributionSchema', () => {
  it('rejects oversized values', () => {
    expect(attributionSchema.safeParse({ utm_source: 'x'.repeat(500) }).success).toBe(false)
  })
})

describe('leadSourceForChannel', () => {
  it('maps GBP and Facebook onto existing lead sources', () => {
    expect(leadSourceForChannel('google_business_profile', undefined)).toBe('gbp')
    expect(leadSourceForChannel('social', { referrer_host: 'l.facebook.com' })).toBe('facebook')
    expect(leadSourceForChannel('social', { referrer_host: 'instagram.com' })).toBe('website')
    expect(leadSourceForChannel('ai_assistant', undefined)).toBe('website')
  })
})

describe('storedChannel', () => {
  it.each([
    [{ channel: 'organic_search' }, 'organic_search'],
    [{}, 'unknown'],
    [{ channel: '' }, 'unknown'],
    [{ channel: 42 }, 'unknown'],
    [null, 'unknown'],
    [['ai_assistant'], 'unknown'],
    ['ai_assistant', 'unknown'],
  ])('reads %j as %s', (attribution, expected) => {
    expect(storedChannel(attribution)).toBe(expected)
  })
})
