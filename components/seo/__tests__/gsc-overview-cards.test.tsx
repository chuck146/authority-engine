import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GscOverviewCards } from '../gsc-overview-cards'
import { buildGscSummary } from '@/tests/factories'

describe('GscOverviewCards', () => {
  it('renders all four metric cards', () => {
    const summary = buildGscSummary()
    render(<GscOverviewCards summary={summary} />)

    expect(screen.getByText('Total Clicks')).toBeInTheDocument()
    expect(screen.getByText('Impressions')).toBeInTheDocument()
    expect(screen.getByText('Avg CTR')).toBeInTheDocument()
    expect(screen.getByText('Avg Position')).toBeInTheDocument()
  })

  it('displays formatted values', () => {
    const summary = buildGscSummary({ clicks: 1250, impressions: 45000, ctr: 0.028, position: 18.3 })
    render(<GscOverviewCards summary={summary} />)

    expect(screen.getByText('1,250')).toBeInTheDocument()
    expect(screen.getByText('45,000')).toBeInTheDocument()
    expect(screen.getByText('2.8%')).toBeInTheDocument()
    expect(screen.getByText('18.3')).toBeInTheDocument()
  })

  it('shows trend indicators with correct direction', () => {
    const summary = buildGscSummary({
      clicksTrend: 12,
      impressionsTrend: -5,
      positionTrend: -10, // negative = improvement for position
    })
    render(<GscOverviewCards summary={summary} />)

    // Positive clicks trend = green up arrow
    expect(screen.getByText(/↑ 12%/)).toBeInTheDocument()
    // Negative impressions trend = red down arrow
    expect(screen.getByText(/↓ 5%/)).toBeInTheDocument()
  })
})
