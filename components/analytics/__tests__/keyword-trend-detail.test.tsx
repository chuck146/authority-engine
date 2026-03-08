import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { KeywordTrendDetail } from '../keyword-trend-detail'
import { buildKeywordTrendPoint } from '@/tests/factories'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

const mockFetch = vi.fn()

describe('KeywordTrendDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = mockFetch
  })

  it('does not render when query is null', () => {
    render(<KeywordTrendDetail query={null} onClose={vi.fn()} />)
    expect(screen.queryByText('Keyword performance over selected period')).not.toBeInTheDocument()
  })

  it('renders trend data for a keyword', async () => {
    const trend = [
      buildKeywordTrendPoint({ date: '2026-03-05', position: 8, clicks: 10 }),
      buildKeywordTrendPoint({ date: '2026-03-06', position: 7, clicks: 15 }),
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(trend),
    })

    render(<KeywordTrendDetail query="painting nj" onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText(/painting nj/)).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('Best Position')).toBeInTheDocument()
      expect(screen.getByText('Latest Position')).toBeInTheDocument()
      expect(screen.getByText('Total Clicks')).toBeInTheDocument()
      expect(screen.getByText('Total Impressions')).toBeInTheDocument()
    })
  })

  it('shows empty state when no trend data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })

    render(<KeywordTrendDetail query="test query" onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('No trend data available.')).toBeInTheDocument()
    })
  })

  it('shows error state on fetch failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error' }),
    })

    render(<KeywordTrendDetail query="test" onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument()
    })
  })
})
