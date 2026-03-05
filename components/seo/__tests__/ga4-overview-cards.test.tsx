import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Ga4OverviewCards } from '../ga4-overview-cards'
import { buildGa4Summary } from '@/tests/factories'

describe('Ga4OverviewCards', () => {
  it('renders all four metric cards', () => {
    const summary = buildGa4Summary()
    render(<Ga4OverviewCards summary={summary} />)

    expect(screen.getByText('Sessions')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('Pageviews')).toBeInTheDocument()
    expect(screen.getByText('Bounce Rate')).toBeInTheDocument()
  })

  it('displays formatted metric values', () => {
    const summary = buildGa4Summary({
      sessions: 3200,
      users: 2100,
      pageviews: 8500,
      bounceRate: 0.42,
    })
    render(<Ga4OverviewCards summary={summary} />)

    expect(screen.getByText('3,200')).toBeInTheDocument()
    expect(screen.getByText('2,100')).toBeInTheDocument()
    expect(screen.getByText('8,500')).toBeInTheDocument()
    expect(screen.getByText('42.0%')).toBeInTheDocument()
  })

  it('shows positive trend indicators', () => {
    const summary = buildGa4Summary({
      sessionsTrend: 15,
      usersTrend: 12,
      pageviewsTrend: 18,
      bounceRateTrend: -3,
    })
    render(<Ga4OverviewCards summary={summary} />)

    // Positive session/user/pageview trends show green arrow up
    expect(screen.getByText(/↑ 15%/)).toBeInTheDocument()
    expect(screen.getByText(/↑ 12%/)).toBeInTheDocument()
    expect(screen.getByText(/↑ 18%/)).toBeInTheDocument()
    // Bounce rate: negative is good (invertColor), shows green arrow down
    expect(screen.getByText(/↓ 3%/)).toBeInTheDocument()
  })

  it('shows zero trend as dash', () => {
    const summary = buildGa4Summary({
      sessionsTrend: 0,
      usersTrend: 0,
      pageviewsTrend: 0,
      bounceRateTrend: 0,
    })
    render(<Ga4OverviewCards summary={summary} />)

    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(4)
  })
})
