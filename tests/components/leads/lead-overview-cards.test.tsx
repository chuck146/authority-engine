import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { LeadOverviewCards } from '@/components/leads/lead-overview-cards'
import { buildLeadOverview } from '@/tests/factories'
import { CHANNEL_LABELS } from '@/lib/leads/attribution-shared'

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
    const overview = buildLeadOverview({
      total: 15,
      newThisWeek: 5,
      inPipeline: 10,
      conversionRate: 0.33,
    })
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

  describe('attribution sections', () => {
    async function renderWith(overrides: Parameters<typeof buildLeadOverview>[0]) {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(buildLeadOverview(overrides)),
      })
      await act(async () => {
        render(<LeadOverviewCards />)
      })
    }

    it('shows channel labels with leads/qualified/won counts', async () => {
      await renderWith({
        byChannel: [{ channel: 'ai_assistant', leads: 7, qualified: 4, won: 2 }],
      })
      expect(screen.getByText('Leads by Channel (observed)')).toBeDefined()
      const row = screen.getByText(CHANNEL_LABELS.ai_assistant).closest('tr')!
      const cells = Array.from(row.querySelectorAll('td')).map((td) => td.textContent)
      expect(cells).toEqual([CHANNEL_LABELS.ai_assistant, '7', '4', '2'])
    })

    it('shows the human label for the discovery source', async () => {
      await renderWith({ byDiscoverySource: [{ source: 'google_maps', count: 6 }] })
      expect(screen.getByText('How They Heard About Us (reported)')).toBeDefined()
      expect(screen.getByText('Google Maps / Business Profile')).toBeDefined()
      expect(screen.queryByText('google_maps')).toBeNull()
    })

    it('shows empty-state text for empty attribution arrays', async () => {
      await renderWith({ byChannel: [], byDiscoverySource: [] })
      expect(screen.getByText('No answers yet')).toBeDefined()
      expect(screen.queryByText('Channel')).toBeNull()
      expect(screen.getAllByText('No data').length).toBeGreaterThanOrEqual(1)
    })

    it('falls back to the raw value for unknown channel and discovery keys', async () => {
      await renderWith({
        byChannel: [{ channel: 'carrier_pigeon', leads: 1, qualified: 0, won: 0 }],
        byDiscoverySource: [{ source: 'skywriting', count: 2 }],
      })
      expect(screen.getByText('carrier_pigeon')).toBeDefined()
      expect(screen.getByText('skywriting')).toBeDefined()
    })
  })
})
