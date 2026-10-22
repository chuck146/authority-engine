import { describe, it, expect } from 'vitest'
import { getServedCounties, NJ_SERVICE_COUNTIES } from '@/lib/data/nj-towns'

const names = (counties: { name: string }[]) => counties.map((c) => c.name)

describe('getServedCounties', () => {
  it('matches county names case-insensitively', () => {
    expect(names(getServedCounties(['union', 'ESSEX']))).toEqual(['Essex', 'Union'])
  })

  it('tolerates a trailing "County" and surrounding whitespace', () => {
    expect(names(getServedCounties(['Union County', '  morris county  ']))).toEqual([
      'Morris',
      'Union',
    ])
  })

  it('returns every serviced county when no names match (never empty)', () => {
    const result = getServedCounties(['Atlantis', 'Gotham County'])
    expect(result).toEqual(NJ_SERVICE_COUNTIES)
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns every serviced county for an empty list', () => {
    expect(getServedCounties([])).toEqual(NJ_SERVICE_COUNTIES)
  })

  it('returns only the known counties from a mixed list', () => {
    expect(names(getServedCounties(['Somerset', 'Atlantis', 'Hudson County']))).toEqual([
      'Hudson',
      'Somerset',
    ])
  })

  it('returns full county objects including towns', () => {
    const [union] = getServedCounties(['Union'])
    expect(union?.slug).toBe('union')
    expect(union?.towns.some((t) => t.slug === 'rahway')).toBe(true)
  })
})
