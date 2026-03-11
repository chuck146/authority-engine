import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ContentPerformanceTable } from '../content-performance-table'
import { buildContentPerformanceItem } from '@/tests/factories'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

const mockFetch = vi.fn()

describe('ContentPerformanceTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = mockFetch
  })

  it('renders content data after loading', async () => {
    const item = buildContentPerformanceItem({ title: 'Exterior Painting' })
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

    render(<ContentPerformanceTable />)

    await waitFor(() => {
      expect(screen.getByText('Exterior Painting')).toBeInTheDocument()
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

    render(<ContentPerformanceTable />)

    await waitFor(() => {
      expect(screen.getByText(/No published content found/)).toBeInTheDocument()
    })
  })

  it('shows error state on fetch failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Failed to load' }),
    })

    render(<ContentPerformanceTable />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument()
    })
  })

  it('renders sortable column headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [buildContentPerformanceItem()],
          total: 1,
          page: 1,
          pageSize: 25,
        }),
    })

    render(<ContentPerformanceTable />)

    await waitFor(() => {
      expect(screen.getByText(/Title/)).toBeInTheDocument()
      expect(screen.getByText(/Sessions/)).toBeInTheDocument()
      expect(screen.getByText(/Users/)).toBeInTheDocument()
      expect(screen.getByText(/Pageviews/)).toBeInTheDocument()
      expect(screen.getByText(/Bounce/)).toBeInTheDocument()
      expect(screen.getByText(/Engagement/)).toBeInTheDocument()
    })
  })

  it('shows pagination when multiple pages', async () => {
    const items = Array.from({ length: 25 }, (_, i) =>
      buildContentPerformanceItem({ id: `sp-${i}`, title: `Page ${i}` }),
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

    render(<ContentPerformanceTable />)

    await waitFor(() => {
      expect(screen.getByText(/Showing 1–25 of 50/)).toBeInTheDocument()
      expect(screen.getByText('Next')).toBeInTheDocument()
    })
  })

  it('renders SEO score badges with correct colors', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [
            buildContentPerformanceItem({ id: 'high', title: 'High SEO', seoScore: 85 }),
            buildContentPerformanceItem({ id: 'mid', title: 'Mid SEO', seoScore: 65 }),
            buildContentPerformanceItem({ id: 'low', title: 'Low SEO', seoScore: 40 }),
          ],
          total: 3,
          page: 1,
          pageSize: 25,
        }),
    })

    render(<ContentPerformanceTable />)

    await waitFor(() => {
      // SEO score badges are <span> elements with score text and color classes
      const badge85 = screen.getByText('85')
      const badge65 = screen.getByText('65')
      const badge40 = screen.getByText('40')
      expect(badge85.className).toContain('green')
      expect(badge65.className).toContain('yellow')
      expect(badge40.className).toContain('red')
    })
  })

  it('renders content type badges', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [
            buildContentPerformanceItem({ id: 'sp1', contentType: 'service_page' }),
            buildContentPerformanceItem({ id: 'lp1', contentType: 'location_page' }),
            buildContentPerformanceItem({ id: 'bp1', contentType: 'blog_post' }),
          ],
          total: 3,
          page: 1,
          pageSize: 25,
        }),
    })

    render(<ContentPerformanceTable />)

    await waitFor(() => {
      expect(screen.getByText('Service')).toBeInTheDocument()
      expect(screen.getByText('Location')).toBeInTheDocument()
      expect(screen.getByText('Blog')).toBeInTheDocument()
    })
  })

  it('renders content type filter dropdown', async () => {
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

    render(<ContentPerformanceTable />)

    await waitFor(() => {
      expect(screen.getByText('All Types')).toBeInTheDocument()
    })
  })
})
