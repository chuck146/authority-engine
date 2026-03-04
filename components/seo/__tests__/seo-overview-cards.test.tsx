import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SeoOverviewCards } from '../seo-overview-cards'
import type { SeoOverview } from '@/types/seo'

function buildOverview(overrides?: Partial<SeoOverview>): SeoOverview {
  return {
    averageScore: 72,
    totalPages: 23,
    scoreDistribution: { excellent: 8, good: 10, needsWork: 3, poor: 2 },
    contentByType: [],
    recentScores: [],
    ...overrides,
  }
}

describe('SeoOverviewCards', () => {
  it('renders overall score', () => {
    render(<SeoOverviewCards overview={buildOverview()} />)
    expect(screen.getByText('72')).toBeInTheDocument()
    expect(screen.getByText('out of 100')).toBeInTheDocument()
  })

  it('renders total pages count', () => {
    render(<SeoOverviewCards overview={buildOverview()} />)
    expect(screen.getByText('23')).toBeInTheDocument()
    expect(screen.getByText('scored pages')).toBeInTheDocument()
  })

  it('renders needs attention count (needsWork + poor)', () => {
    render(<SeoOverviewCards overview={buildOverview()} />)
    expect(screen.getByText('5')).toBeInTheDocument() // 3 + 2
    expect(screen.getByText('pages below 60')).toBeInTheDocument()
  })

  it('renders excellent count', () => {
    render(<SeoOverviewCards overview={buildOverview()} />)
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('pages scoring 80+')).toBeInTheDocument()
  })
})
