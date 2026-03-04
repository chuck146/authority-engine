import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { DashboardMetricsClient } from '../dashboard-metrics-client'
import { buildDashboardMetrics } from '@/tests/factories'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  global.fetch = mockFetch
})

describe('DashboardMetricsClient', () => {
  it('shows loading skeletons initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {})) // never resolves
    render(<DashboardMetricsClient />)

    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders metrics after successful fetch', async () => {
    const metrics = buildDashboardMetrics()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(metrics),
    })

    render(<DashboardMetricsClient />)

    await waitFor(() => {
      expect(screen.getByText('Published Pages')).toBeInTheDocument()
      expect(screen.getByText('Content Pipeline')).toBeInTheDocument()
      expect(screen.getByText('Recent Activity')).toBeInTheDocument()
    })
  })

  it('shows error state on fetch failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    })

    render(<DashboardMetricsClient />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument()
    })
  })

  it('shows error state on network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    render(<DashboardMetricsClient />)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })
})
