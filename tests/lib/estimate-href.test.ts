import { describe, it, expect, vi } from 'vitest'
import { getEstimateHref } from '@/lib/marketing/estimate'

vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000')

describe('getEstimateHref', () => {
  it('defaults to the on-site estimate page', () => {
    expect(getEstimateHref(null)).toBe('/estimate')
    expect(getEstimateHref({})).toBe('/estimate')
  })

  it('preselects the service when given', () => {
    expect(getEstimateHref({}, 'interior-painting')).toBe('/estimate?service=interior-painting')
  })

  it('replaces the legacy same-site homepage anchor with the estimate page', () => {
    expect(getEstimateHref({ estimate_url: 'https://cleanestpaintingnj.com/#estimate' })).toBe(
      '/estimate',
    )
    expect(getEstimateHref({ estimate_url: 'https://www.cleanestpaintingnj.com/estimate' })).toBe(
      '/estimate',
    )
    expect(getEstimateHref({ estimate_url: '/#estimate' })).toBe('/estimate')
  })

  it('keeps an external estimate tool', () => {
    expect(getEstimateHref({ estimate_url: 'https://book.example-crm.com/cleanest' })).toBe(
      'https://book.example-crm.com/cleanest',
    )
  })
})
