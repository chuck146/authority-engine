import { describe, it, expect } from 'vitest'
import { buildReviewRequestMessage } from '../message-template'

describe('buildReviewRequestMessage', () => {
  const baseParams = {
    customerName: 'John Smith',
    orgName: 'Cleanest Painting LLC',
    reviewUrl: 'https://g.page/r/cleanest-painting/review',
  }

  it('uses default template when no custom message', () => {
    const message = buildReviewRequestMessage(baseParams)

    expect(message).toContain('Hi John Smith!')
    expect(message).toContain('Cleanest Painting LLC')
    expect(message).toContain('https://g.page/r/cleanest-painting/review')
    expect(message).toContain('leave us a review')
  })

  it('interpolates variables in custom message', () => {
    const message = buildReviewRequestMessage({
      ...baseParams,
      customMessage: 'Hey {name}, {org} appreciates you! Review us here: {url}',
    })

    expect(message).toBe(
      'Hey John Smith, Cleanest Painting LLC appreciates you! Review us here: https://g.page/r/cleanest-painting/review',
    )
  })

  it('handles multiple occurrences of same variable', () => {
    const message = buildReviewRequestMessage({
      ...baseParams,
      customMessage: '{name}, {name} - visit {url}',
    })

    expect(message).toBe(
      'John Smith, John Smith - visit https://g.page/r/cleanest-painting/review',
    )
  })

  it('returns custom message as-is when no variables used', () => {
    const message = buildReviewRequestMessage({
      ...baseParams,
      customMessage: 'Please review us on Google!',
    })

    expect(message).toBe('Please review us on Google!')
  })

  it('handles empty custom message by using default', () => {
    const message = buildReviewRequestMessage({
      ...baseParams,
      customMessage: '',
    })

    expect(message).toContain('Hi John Smith!')
  })

  it('handles special characters in names', () => {
    const message = buildReviewRequestMessage({
      ...baseParams,
      customerName: "María O'Brien",
    })

    expect(message).toContain("María O'Brien")
  })

  it('handles long URLs', () => {
    const longUrl = 'https://www.google.com/maps/place/Cleanest+Painting+LLC/@40.123,-74.456'
    const message = buildReviewRequestMessage({
      ...baseParams,
      reviewUrl: longUrl,
    })

    expect(message).toContain(longUrl)
  })

  it('produces message within SMS limits with default template', () => {
    const message = buildReviewRequestMessage(baseParams)
    // Standard SMS is 160 chars, but we allow up to 320 (two segments)
    expect(message.length).toBeLessThanOrEqual(320)
  })
})
