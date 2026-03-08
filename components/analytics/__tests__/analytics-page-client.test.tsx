import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AnalyticsPageClient } from '../analytics-page-client'
import { buildAnalyticsOverview } from '@/tests/factories'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

const mockFetch = vi.fn()

describe('AnalyticsPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = mockFetch
  })

  it('renders loading state initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {})) // never resolves
    render(<AnalyticsPageClient />)

    // Should show tabs
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Keywords')).toBeInTheDocument()
    expect(screen.getByText('Search Performance')).toBeInTheDocument()
  })

  it('renders overview data after loading', async () => {
    const overview = buildAnalyticsOverview()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(overview),
    })

    render(<AnalyticsPageClient />)

    await waitFor(() => {
      expect(screen.getByText('3,200')).toBeInTheDocument() // sessions
    })
  })

  it('renders error state on fetch failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error' }),
    })

    render(<AnalyticsPageClient />)

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument()
    })
  })

  it('shows connection prompt when nothing connected', async () => {
    const overview = buildAnalyticsOverview({
      ga4Connected: false,
      gscConnected: false,
      ga4: null,
      gsc: null,
      keywords: { totalTracked: 0, avgPosition: 0, topMovers: [] },
    })
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(overview),
    })

    render(<AnalyticsPageClient />)

    await waitFor(() => {
      expect(screen.getByText(/No analytics integrations connected/)).toBeInTheDocument()
    })
  })

  it('renders date range picker', () => {
    mockFetch.mockReturnValue(new Promise(() => {}))
    render(<AnalyticsPageClient />)

    expect(screen.getByText('Last 28 days')).toBeInTheDocument()
  })
})
