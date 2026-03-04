import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IntegrationsSection } from '../integrations-section'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  global.fetch = mockFetch
})

describe('IntegrationsSection', () => {
  it('shows loading skeleton initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {}))
    render(<IntegrationsSection />)

    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows Connect button when not connected', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        isConnected: false,
        provider: null,
        siteUrl: null,
        connectedAt: null,
      }),
    })

    render(<IntegrationsSection />)

    await waitFor(() => {
      expect(screen.getByText('Google Search Console')).toBeInTheDocument()
      expect(screen.getByText('Not Connected')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument()
    })
  })

  it('shows Disconnect button and site URL when connected', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        isConnected: true,
        provider: 'search_console',
        siteUrl: 'https://cleanestpainting.com',
        connectedAt: '2026-03-01T00:00:00Z',
      }),
    })

    render(<IntegrationsSection />)

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument()
      expect(screen.getByText('https://cleanestpainting.com')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Disconnect' })).toBeInTheDocument()
    })
  })

  it('redirects to Google OAuth on Connect click', async () => {
    // Initial status fetch — not connected
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        isConnected: false,
        provider: null,
        siteUrl: null,
        connectedAt: null,
      }),
    })

    render(<IntegrationsSection />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument()
    })

    // OAuth start response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ url: 'https://accounts.google.com/o/oauth2/auth?...' }),
    })

    // Mock window.location
    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: '' },
    })

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Connect' }))

    await waitFor(() => {
      expect(window.location.href).toBe('https://accounts.google.com/o/oauth2/auth?...')
    })

    // Restore
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    })
  })

  it('handles disconnect flow', async () => {
    // Initial status fetch — connected
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        isConnected: true,
        provider: 'search_console',
        siteUrl: 'https://cleanestpainting.com',
        connectedAt: '2026-03-01T00:00:00Z',
      }),
    })

    render(<IntegrationsSection />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Disconnect' })).toBeInTheDocument()
    })

    // Disconnect response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Disconnect' }))

    await waitFor(() => {
      expect(screen.getByText('Not Connected')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument()
    })
  })

  it('handles status fetch failure gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    })

    render(<IntegrationsSection />)

    await waitFor(() => {
      expect(screen.getByText('Not Connected')).toBeInTheDocument()
    })
  })
})
