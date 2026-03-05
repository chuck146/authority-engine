import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricsHeroCards } from '../metrics-hero-cards'
import { buildHeroMetrics } from '@/tests/factories'

describe('MetricsHeroCards', () => {
  it('renders all 4 metric cards', () => {
    render(<MetricsHeroCards hero={buildHeroMetrics()} />)

    expect(screen.getByText('Published Pages')).toBeInTheDocument()
    expect(screen.getByText('Avg. SEO Score')).toBeInTheDocument()
    expect(screen.getByText('Needs Review')).toBeInTheDocument()
    expect(screen.getByText('Next Publish')).toBeInTheDocument()
  })

  it('displays hero values correctly', () => {
    render(
      <MetricsHeroCards hero={buildHeroMetrics({ totalPublished: 42, averageSeoScore: 88 })} />,
    )

    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('88')).toBeInTheDocument()
  })

  it('applies orange color when content needs review', () => {
    render(<MetricsHeroCards hero={buildHeroMetrics({ contentInReview: 5 })} />)

    const reviewValue = screen.getByText('5')
    expect(reviewValue.className).toContain('text-orange-600')
  })

  it('does not apply orange when no content in review', () => {
    render(<MetricsHeroCards hero={buildHeroMetrics({ contentInReview: 0 })} />)

    const reviewValue = screen.getByText('0')
    expect(reviewValue.className).not.toContain('text-orange-600')
  })

  it('shows dash when no next publish scheduled', () => {
    render(<MetricsHeroCards hero={buildHeroMetrics({ nextScheduledPublish: null })} />)

    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('nothing scheduled')).toBeInTheDocument()
  })
})
