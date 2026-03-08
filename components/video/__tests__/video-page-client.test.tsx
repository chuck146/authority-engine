import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { VideoPageClient } from '../video-page-client'
import { buildVideoLibraryItem } from '@/tests/factories'

vi.mock('../video-generate-form', () => ({
  VideoGenerateForm: () => <div data-testid="video-generate-form">Generate Form</div>,
}))

vi.mock('../video-library-grid', () => ({
  VideoLibraryGrid: ({ items, loading }: { items: unknown[]; loading: boolean }) => (
    <div data-testid="video-library-grid">{loading ? 'Loading...' : `${items.length} videos`}</div>
  ),
}))

vi.mock('../video-detail-sheet', () => ({
  VideoDetailSheet: () => <div data-testid="video-detail-sheet" />,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('VideoPageClient', () => {
  it('shows loading state initially', () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    })

    render(<VideoPageClient />)

    expect(screen.getByText('Loading...')).toBeDefined()
  })

  it('fetches and displays video items', async () => {
    const items = [buildVideoLibraryItem(), buildVideoLibraryItem({ id: 'video-2' })]

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items }),
    })

    render(<VideoPageClient />)

    await waitFor(() => {
      expect(screen.getByText('2 videos')).toBeDefined()
    })
  })

  it('renders Library and Generate tabs', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    })

    render(<VideoPageClient />)

    await waitFor(() => {
      expect(screen.getByText(/Library/)).toBeDefined()
      expect(screen.getByText('Generate')).toBeDefined()
    })
  })

  it('handles fetch failure gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Failed' }),
    })

    render(<VideoPageClient />)

    await waitFor(() => {
      expect(screen.getByText('0 videos')).toBeDefined()
    })
  })
})
