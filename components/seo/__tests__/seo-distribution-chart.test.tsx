import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SeoDistributionChart } from '../seo-distribution-chart'

describe('SeoDistributionChart', () => {
  it('shows empty message when total is 0', () => {
    render(
      <SeoDistributionChart
        distribution={{ excellent: 0, good: 0, needsWork: 0, poor: 0 }}
        total={0}
      />,
    )
    expect(screen.getByText('No pages to display.')).toBeInTheDocument()
  })

  it('renders all segment labels', () => {
    render(
      <SeoDistributionChart
        distribution={{ excellent: 5, good: 10, needsWork: 3, poor: 2 }}
        total={20}
      />,
    )
    expect(screen.getByText(/Excellent.*5/)).toBeInTheDocument()
    expect(screen.getByText(/Good.*10/)).toBeInTheDocument()
    expect(screen.getByText(/Needs Work.*3/)).toBeInTheDocument()
    expect(screen.getByText(/Poor.*2/)).toBeInTheDocument()
  })

  it('renders bar segments for non-zero values', () => {
    const { container } = render(
      <SeoDistributionChart
        distribution={{ excellent: 5, good: 5, needsWork: 0, poor: 0 }}
        total={10}
      />,
    )
    // Bar container is the rounded-full div; bar segments have inline width style
    const barContainer = container.querySelector('.rounded-full')!
    const barSegments = barContainer.querySelectorAll('[style]')

    // Only excellent (green) and good (yellow) should render as bar segments
    expect(barSegments).toHaveLength(2)
    expect(barContainer.querySelector('.bg-green-500')).toBeInTheDocument()
    expect(barContainer.querySelector('.bg-yellow-500')).toBeInTheDocument()
    expect(barContainer.querySelector('.bg-orange-500')).not.toBeInTheDocument()
  })
})
