import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Ga4TopPages } from '../ga4-top-pages'
import { buildGa4PageMetric } from '@/tests/factories'

describe('Ga4TopPages', () => {
  it('renders table with page data', () => {
    const pages = [
      buildGa4PageMetric({
        pagePath: '/services/painting',
        sessions: 150,
        users: 120,
        pageviews: 280,
        bounceRate: 0.38,
      }),
      buildGa4PageMetric({
        pagePath: '/locations/summit',
        sessions: 80,
        users: 60,
        pageviews: 140,
        bounceRate: 0.45,
      }),
    ]
    render(<Ga4TopPages pages={pages} />)

    expect(screen.getByText('Top Pages')).toBeInTheDocument()
    expect(screen.getByText('/services/painting')).toBeInTheDocument()
    expect(screen.getByText('/locations/summit')).toBeInTheDocument()
    expect(screen.getByText('38.0%')).toBeInTheDocument()
    expect(screen.getByText('45.0%')).toBeInTheDocument()
  })

  it('shows empty state when no pages', () => {
    render(<Ga4TopPages pages={[]} />)

    expect(screen.getByText('Top Pages')).toBeInTheDocument()
    expect(screen.getByText('No page data available yet.')).toBeInTheDocument()
  })
})
