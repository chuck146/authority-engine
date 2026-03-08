import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IntegrationsSection } from '../integrations-section'
import { toast } from 'sonner'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const mockUseSearchParams = vi.fn()

vi.mock('next/navigation', async (importActual) => {
  const actual = await importActual<typeof import('next/navigation')>()
  return {
    ...actual,
    useSearchParams: () => mockUseSearchParams(),
  }
})

const mockFetch = vi.fn()

const notConnected = {
  isConnected: false,
  provider: null,
  siteUrl: null,
  propertyId: null,
  connectedAt: null,
}

const gscConnected = {
  isConnected: true,
  provider: 'search_console',
  siteUrl: 'https://cleanestpainting.com',
  connectedAt: '2026-03-01T00:00:00Z',
}

const ga4Connected = {
  isConnected: true,
  provider: 'analytics',
  propertyId: 'properties/123456',
  connectedAt: '2026-03-01T00:00:00Z',
}

function mockStatuses(
  gsc: Record<string, unknown> = notConnected,
  ga4: Record<string, unknown> = notConnected,
  gbp: Record<string, unknown> = notConnected,
  extras?: Record<string, () => Promise<Response>>,
) {
  mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
    if (extras) {
      const key = `${opts?.method ?? 'GET'} ${url}`
      if (extras[key]) return extras[key]()
    }
    if (url === '/api/v1/integrations/google/status') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(gsc) })
    }
    if (url === '/api/v1/integrations/ga4/status') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(ga4) })
    }
    if (url === '/api/v1/integrations/gbp/status') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(gbp) })
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  global.fetch = mockFetch
  mockUseSearchParams.mockReturnValue(new URLSearchParams())
})

describe('IntegrationsSection', () => {
  it('shows loading skeleton initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {}))
    render(<IntegrationsSection />)

    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows Connect buttons when not connected', async () => {
    mockStatuses(notConnected, notConnected, notConnected)

    render(<IntegrationsSection />)

    await waitFor(() => {
      expect(screen.getByText('Google Search Console')).toBeInTheDocument()
      expect(screen.getByText('Google Analytics')).toBeInTheDocument()
      expect(screen.getByText('Google Business Profile')).toBeInTheDocument()
      expect(screen.getAllByText('Not Connected')).toHaveLength(3)
      expect(screen.getAllByRole('button', { name: 'Connect' })).toHaveLength(3)
    })
  })

  it('shows Disconnect button and site URL when GSC connected', async () => {
    mockStatuses(gscConnected, notConnected, notConnected)

    render(<IntegrationsSection />)

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument()
      expect(screen.getByText('https://cleanestpainting.com')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Disconnect' })).toBeInTheDocument()
      expect(screen.getAllByText('Not Connected')).toHaveLength(2)
    })
  })

  it('shows property ID when GA4 connected', async () => {
    mockStatuses(notConnected, ga4Connected)

    render(<IntegrationsSection />)

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument()
      expect(screen.getByText('properties/123456')).toBeInTheDocument()
    })
  })

  it('redirects to Google OAuth on Connect click', async () => {
    mockStatuses(notConnected, notConnected, notConnected)

    render(<IntegrationsSection />)

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Connect' })).toHaveLength(3)
    })

    // Mock window.location
    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: '' },
    })

    const user = userEvent.setup()
    // First Connect button is GSC
    const connectButtons = screen.getAllByRole('button', { name: 'Connect' })
    await user.click(connectButtons[0]!)

    expect(window.location.href).toBe('/api/auth/google?provider=search_console')

    // Restore
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    })
  })

  it('handles disconnect flow', async () => {
    mockStatuses(gscConnected, notConnected, notConnected, {
      'POST /api/v1/integrations/google/disconnect': () =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response),
    })

    render(<IntegrationsSection />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Disconnect' })).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Disconnect' }))

    await waitFor(() => {
      expect(screen.getAllByText('Not Connected')).toHaveLength(3)
      expect(screen.getAllByRole('button', { name: 'Connect' })).toHaveLength(3)
    })
  })

  it('handles status fetch failure gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    })

    render(<IntegrationsSection />)

    await waitFor(() => {
      expect(screen.getAllByText('Not Connected')).toHaveLength(3)
    })
  })

  it('shows success toast when URL has status=connected', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('status=connected&provider=analytics'))
    mockStatuses(notConnected, notConnected, notConnected)

    render(<IntegrationsSection />)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('analytics connected successfully')
    })
  })

  it('shows error toast with detail when URL has status=error', async () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams('status=error&message=token_exchange_failed&detail=API+not+enabled'),
    )
    mockStatuses(notConnected, notConnected, notConnected)

    render(<IntegrationsSection />)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Connection failed: token_exchange_failed — API not enabled',
      )
    })
  })
})
