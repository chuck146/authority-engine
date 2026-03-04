import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Ga4Dashboard } from '../ga4-dashboard'
import { buildGa4Overview } from '@/tests/factories'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  global.fetch = mockFetch
})

describe('Ga4Dashboard', () => {
  it('shows loading skeletons initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {}))
    render(<Ga4Dashboard />)

    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders overview when connected', async () => {
    const overview = buildGa4Overview()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(overview),
    })

    render(<Ga4Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument()
      expect(screen.getByText('Top Pages')).toBeInTheDocument()
      expect(screen.getByText('Traffic Sources')).toBeInTheDocument()
      expect(screen.getByText('Device Breakdown')).toBeInTheDocument()
      expect(screen.getByText('Traffic Trend (28 Days)')).toBeInTheDocument()
    })
  })

  it('shows connection CTA when not connected', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...buildGa4Overview(), isConnected: false }),
    })

    render(<Ga4Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Google Analytics not connected')).toBeInTheDocument()
      expect(screen.getByText('Go to Settings')).toBeInTheDocument()
    })
  })

  it('shows error state on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })

    render(<Ga4Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load GA4 data')).toBeInTheDocument()
    })
  })

  it('shows error state on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<Ga4Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })
})
