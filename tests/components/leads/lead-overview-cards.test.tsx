import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { LeadOverviewCards } from '@/components/leads/lead-overview-cards'
import { buildLeadOverview } from '@/tests/factories'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('LeadOverviewCards', () => {
  it('shows loading state initially', () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}))
    render(<LeadOverviewCards />)
    expect(screen.getByText('Loading overview...')).toBeDefined()
  })

  it('renders hero cards with data', async () => {
    const overview = buildLeadOverview({ total: 15, newThisWeek: 5, inPipeline: 10, conversionRate: 0.33 })
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(overview),
    })

    await act(async () => {
      render(<LeadOverviewCards />)
    })

    expect(screen.getByText('Total Leads')).toBeDefined()
    expect(screen.getByText('15')).toBeDefined()
    expect(screen.getByText('New This Week')).toBeDefined()
    expect(screen.getByText('In Pipeline')).toBeDefined()
    expect(screen.getByText('Conversion Rate')).toBeDefined()
    expect(screen.getByText('33%')).toBeDefined()
  })

  it('renders source and service breakdowns', async () => {
    const overview = buildLeadOverview()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(overview),
    })

    await act(async () => {
      render(<LeadOverviewCards />)
    })

    expect(screen.getByText('Leads by Source')).toBeDefined()
    expect(screen.getByText('Top Services Requested')).toBeDefined()
    expect(screen.getByText('Interior Painting')).toBeDefined()
  })
})
