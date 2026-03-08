import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Ga4PropertySelector } from '../ga4-property-selector'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  global.fetch = mockFetch
})

describe('Ga4PropertySelector', () => {
  it('shows loading skeleton initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {}))
    render(<Ga4PropertySelector />)

    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders property options with website URLs after loading', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          properties: [
            {
              propertyId: 'properties/111',
              displayName: 'Main Site',
              accountName: 'Cleanest Painting',
              websiteUrl: 'https://cleanestpainting.com',
            },
            {
              propertyId: 'properties/222',
              displayName: 'Blog',
              accountName: 'Cleanest Painting',
              websiteUrl: null,
            },
          ],
        }),
    })

    render(<Ga4PropertySelector />)

    await waitFor(() => {
      expect(screen.getByText('Select GA4 Property')).toBeInTheDocument()
      expect(
        screen.getByText('Main Site — https://cleanestpainting.com (Cleanest Painting)'),
      ).toBeInTheDocument()
      expect(screen.getByText('Blog (Cleanest Painting)')).toBeInTheDocument()
    })
  })

  it('auto-selects when only one property', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          properties: [
            {
              propertyId: 'properties/111',
              displayName: 'Main Site',
              accountName: 'Cleanest Painting',
              websiteUrl: 'https://cleanestpainting.com',
            },
          ],
        }),
    })

    render(<Ga4PropertySelector />)

    await waitFor(() => {
      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('properties/111')
    })
  })

  it('shows empty state when no properties', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ properties: [] }),
    })

    render(<Ga4PropertySelector />)

    await waitFor(() => {
      expect(screen.getByText('No GA4 properties found for this account.')).toBeInTheDocument()
    })
  })

  it('saves selected property', async () => {
    // Load properties
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          properties: [
            {
              propertyId: 'properties/111',
              displayName: 'Main Site',
              accountName: 'Cleanest Painting',
              websiteUrl: 'https://cleanestpainting.com',
            },
            {
              propertyId: 'properties/222',
              displayName: 'Blog',
              accountName: 'Cleanest Painting',
              websiteUrl: null,
            },
          ],
        }),
    })

    render(<Ga4PropertySelector />)

    await waitFor(() => {
      expect(screen.getByText('Select GA4 Property')).toBeInTheDocument()
    })

    // Select a property
    const user = userEvent.setup()
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'properties/222')

    // Mock save response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, propertyId: 'properties/222' }),
    })

    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/integrations/ga4/select-property',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ propertyId: 'properties/222' }),
        }),
      )
    })
  })

  it('disables Save button when no property selected', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          properties: [
            {
              propertyId: 'properties/111',
              displayName: 'Main Site',
              accountName: 'Cleanest Painting',
              websiteUrl: 'https://cleanestpainting.com',
            },
            {
              propertyId: 'properties/222',
              displayName: 'Blog',
              accountName: 'Cleanest Painting',
              websiteUrl: null,
            },
          ],
        }),
    })

    render(<Ga4PropertySelector />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    })
  })
})
