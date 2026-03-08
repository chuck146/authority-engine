import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { KeywordRankingsTable } from '../keyword-rankings-table'
import { buildKeywordRankingListItem } from '@/tests/factories'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

const mockFetch = vi.fn()

describe('KeywordRankingsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = mockFetch
  })

  it('renders keyword data after loading', async () => {
    const item = buildKeywordRankingListItem({ query: 'painting summit nj' })
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [item],
          total: 1,
          page: 1,
          pageSize: 25,
        }),
    })

    render(<KeywordRankingsTable />)

    await waitFor(() => {
      expect(screen.getByText('painting summit nj')).toBeInTheDocument()
    })
  })

  it('shows empty state when no data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [],
          total: 0,
          page: 1,
          pageSize: 25,
        }),
    })

    render(<KeywordRankingsTable />)

    await waitFor(() => {
      expect(screen.getByText(/No keyword ranking data available/)).toBeInTheDocument()
    })
  })

  it('shows error state on fetch failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Failed to load' }),
    })

    render(<KeywordRankingsTable />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument()
    })
  })

  it('renders sortable column headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [buildKeywordRankingListItem()],
          total: 1,
          page: 1,
          pageSize: 25,
        }),
    })

    render(<KeywordRankingsTable />)

    await waitFor(() => {
      expect(screen.getByText('Avg Position')).toBeInTheDocument()
      expect(screen.getByText(/Clicks/)).toBeInTheDocument()
      expect(screen.getByText('Impressions')).toBeInTheDocument()
      expect(screen.getByText('CTR')).toBeInTheDocument()
      expect(screen.getByText(/Change/)).toBeInTheDocument()
    })
  })

  it('shows pagination when multiple pages', async () => {
    const items = Array.from({ length: 25 }, (_, i) =>
      buildKeywordRankingListItem({ query: `keyword-${i}` }),
    )
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          items,
          total: 50,
          page: 1,
          pageSize: 25,
        }),
    })

    render(<KeywordRankingsTable />)

    await waitFor(() => {
      expect(screen.getByText(/Showing 1–25 of 50/)).toBeInTheDocument()
      expect(screen.getByText('Next')).toBeInTheDocument()
    })
  })

  it('renders position change indicators', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [
            buildKeywordRankingListItem({ query: 'improved', positionChange: 3.2 }),
            buildKeywordRankingListItem({ query: 'worsened', positionChange: -1.5 }),
          ],
          total: 2,
          page: 1,
          pageSize: 25,
        }),
    })

    render(<KeywordRankingsTable />)

    await waitFor(() => {
      expect(screen.getByText(/↑3.2/)).toBeInTheDocument()
      expect(screen.getByText(/↓1.5/)).toBeInTheDocument()
    })
  })
})
