import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { GscDashboard } from '../gsc-dashboard'
import { buildGscOverview } from '@/tests/factories'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  global.fetch = mockFetch
})

describe('GscDashboard', () => {
  it('shows loading skeletons initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {}))
    render(<GscDashboard />)

    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders GSC overview after successful fetch', async () => {
    const overview = buildGscOverview()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(overview),
    })

    render(<GscDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Total Clicks')).toBeInTheDocument()
      expect(screen.getByText('Top Queries')).toBeInTheDocument()
      expect(screen.getByText('Top Pages')).toBeInTheDocument()
      expect(screen.getByText('Indexing Coverage')).toBeInTheDocument()
    })
  })

  it('shows not-connected state when GSC is disconnected', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        isConnected: false,
        siteUrl: null,
        lastSyncedAt: null,
        summary: null,
        topQueries: [],
        topPages: [],
        sitemaps: [],
        indexingCoverage: null,
      }),
    })

    render(<GscDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Google Search Console not connected')).toBeInTheDocument()
      expect(screen.getByText('Go to Settings')).toBeInTheDocument()
    })
  })

  it('shows error state on fetch failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    })

    render(<GscDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load GSC data')).toBeInTheDocument()
    })
  })
})
