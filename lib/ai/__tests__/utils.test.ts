import { describe, it, expect } from 'vitest'
import { generateSlug, generateTitleFromInput } from '../utils'

describe('generateSlug', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(generateSlug('Interior Painting')).toBe('interior-painting')
  })

  it('strips special characters', () => {
    expect(generateSlug('Hello! World? #Test')).toBe('hello-world-test')
  })

  it('collapses multiple hyphens', () => {
    expect(generateSlug('foo  --  bar')).toBe('foo-bar')
  })

  it('trims leading/trailing hyphens', () => {
    expect(generateSlug('  -hello world-  ')).toBe('hello-world')
  })

  it('handles empty string', () => {
    expect(generateSlug('')).toBe('')
  })

  it('handles numbers', () => {
    expect(generateSlug('Top 10 Paint Colors 2026')).toBe('top-10-paint-colors-2026')
  })

  it('preserves existing hyphens', () => {
    expect(generateSlug('one-two-three')).toBe('one-two-three')
  })
})

describe('generateTitleFromInput', () => {
  it('returns serviceName for service_page', () => {
    expect(
      generateTitleFromInput({ contentType: 'service_page', serviceName: 'Deck Staining' }),
    ).toBe('Deck Staining')
  })

  it('falls back for service_page with no serviceName', () => {
    expect(generateTitleFromInput({ contentType: 'service_page' })).toBe('Service Page')
  })

  it('returns location string for location_page', () => {
    expect(
      generateTitleFromInput({
        contentType: 'location_page',
        serviceName: 'Painting',
        city: 'Summit',
        state: 'NJ',
      }),
    ).toBe('Painting in Summit, NJ')
  })

  it('falls back for location_page with missing fields', () => {
    expect(generateTitleFromInput({ contentType: 'location_page' })).toBe('Service in City, ST')
  })

  it('returns topic for blog_post', () => {
    expect(generateTitleFromInput({ contentType: 'blog_post', topic: 'How to Choose Paint' })).toBe(
      'How to Choose Paint',
    )
  })

  it('falls back for blog_post with no topic', () => {
    expect(generateTitleFromInput({ contentType: 'blog_post' })).toBe('Blog Post')
  })

  it('returns Content for unknown type', () => {
    expect(generateTitleFromInput({ contentType: 'unknown' })).toBe('Content')
  })
})
