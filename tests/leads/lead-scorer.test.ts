import { describe, it, expect } from 'vitest'
import { scoreLead } from '@/lib/leads/lead-scorer'

function buildInput(overrides: Partial<Parameters<typeof scoreLead>[0]> = {}) {
  return {
    service: null,
    message: null,
    phone: null,
    email: null,
    createdAt: new Date(), // default: just now
    ...overrides,
  }
}

describe('scoreLead', () => {
  it('scores +30 for a high-value service', () => {
    const result = scoreLead(buildInput({ service: 'Exterior Painting' }))
    expect(result.reasons).toContain('High-value service requested')
    expect(result.score).toBeGreaterThanOrEqual(50)
  })

  it('scores +20 for a mid-value service', () => {
    const result = scoreLead(buildInput({ service: 'Interior Painting' }))
    expect(result.reasons).toContain('Mid-value service requested')
    expect(result.score).toBeGreaterThanOrEqual(40)
  })

  it('scores +10 for an unrecognized service', () => {
    const result = scoreLead(buildInput({ service: 'Pressure Washing' }))
    expect(result.reasons).toContain('Service requested')
    expect(result.score).toBe(30)
  })

  it('adds no service points when service is null', () => {
    const result = scoreLead(buildInput({ service: null }))
    expect(result.reasons).not.toContain('Service requested')
    expect(result.reasons).not.toContain('High-value service requested')
    expect(result.reasons).not.toContain('Mid-value service requested')
    expect(result.score).toBe(20)
  })

  it('scores message length buckets correctly', () => {
    const brief = scoreLead(buildInput({ message: 'Hi' }))
    expect(brief.reasons).toContain('Brief message provided')

    const medium = scoreLead(buildInput({ message: 'x'.repeat(100) }))
    expect(medium.reasons).toContain('Message provided (50-200 chars)')

    const detailed = scoreLead(buildInput({ message: 'x'.repeat(250) }))
    expect(detailed.reasons).toContain('Detailed message (200+ chars)')

    expect(detailed.score).toBeGreaterThan(medium.score)
    expect(medium.score).toBeGreaterThan(brief.score)
  })

  it('scores +10 when both phone and email are provided', () => {
    const withBoth = scoreLead(buildInput({ phone: '555-1234', email: 'a@b.com' }))
    const withoutBoth = scoreLead(buildInput({ phone: '555-1234', email: null }))

    expect(withBoth.reasons).toContain('Both phone and email provided')
    expect(withBoth.score - withoutBoth.score).toBe(10)
  })

  it('assigns recency points based on submission age', () => {
    const now = Date.now()

    const justNow = scoreLead(buildInput({ createdAt: new Date(now - 10 * 60 * 1000) }))
    expect(justNow.reasons).toContain('Submitted within last hour')

    const fewHours = scoreLead(buildInput({ createdAt: new Date(now - 6 * 60 * 60 * 1000) }))
    expect(fewHours.reasons).toContain('Submitted within last 24 hours')

    const twoDays = scoreLead(buildInput({ createdAt: new Date(now - 48 * 60 * 60 * 1000) }))
    expect(twoDays.reasons).toContain('Submitted within last 3 days')

    const old = scoreLead(buildInput({ createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000) }))
    expect(old.reasons).toContain('Submitted over 3 days ago')

    expect(justNow.score).toBeGreaterThan(fewHours.score)
    expect(fewHours.score).toBeGreaterThan(twoDays.score)
    expect(twoDays.score).toBeGreaterThan(old.score)
  })

  it('assigns hot/warm/cold labels based on score thresholds', () => {
    const hot = scoreLead(
      buildInput({
        service: 'Full House Painting',
        message: 'x'.repeat(250),
        phone: '555-1234',
        email: 'test@example.com',
        createdAt: new Date(),
      }),
    )
    expect(hot.scoreLabel).toBe('hot')
    expect(hot.score).toBeGreaterThanOrEqual(70)

    const warm = scoreLead(
      buildInput({
        service: 'Room Painting',
        createdAt: new Date(),
      }),
    )
    expect(warm.scoreLabel).toBe('warm')
    expect(warm.score).toBeGreaterThanOrEqual(40)
    expect(warm.score).toBeLessThan(70)

    const cold = scoreLead(
      buildInput({
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      }),
    )
    expect(cold.scoreLabel).toBe('cold')
    expect(cold.score).toBeLessThan(40)
  })
})
