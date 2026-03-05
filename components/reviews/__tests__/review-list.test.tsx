import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ReviewList } from '../review-list'

// Mock the detail sheet
vi.mock('../review-detail-sheet', () => ({
  ReviewDetailSheet: () => null,
}))

const mockReviews = [
  {
    id: 'r-1',
    platform: 'google',
    reviewerName: 'John Smith',
    rating: 5,
    reviewText: 'Excellent painting work!',
    reviewDate: '2026-03-01T12:00:00Z',
    responseStatus: 'pending',
    sentiment: null,
    createdAt: '2026-03-01T12:00:00Z',
  },
  {
    id: 'r-2',
    platform: 'yelp',
    reviewerName: 'Jane Doe',
    rating: 3,
    reviewText: 'Average service',
    reviewDate: '2026-03-02T12:00:00Z',
    responseStatus: 'review',
    sentiment: 'neutral',
    createdAt: '2026-03-02T12:00:00Z',
  },
]

describe('ReviewList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}))
    render(<ReviewList />)

    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders reviews after loading', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockReviews),
    })

    render(<ReviewList />)

    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument()
    })

    expect(screen.getByText('Google')).toBeInTheDocument()
    expect(screen.getByText('Yelp')).toBeInTheDocument()
  })

  it('shows empty state when no reviews', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })

    render(<ReviewList />)

    await waitFor(() => {
      expect(screen.getByText(/No reviews yet/)).toBeInTheDocument()
    })
  })

  it('shows error state on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
    })

    render(<ReviewList />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load reviews')).toBeInTheDocument()
    })
  })

  it('passes platform filter to API', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })
    global.fetch = mockFetch

    render(<ReviewList platform="google" />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('platform=google'))
    })
  })

  it('renders title with platform filter', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockReviews),
    })

    render(<ReviewList platform="google" />)

    await waitFor(() => {
      expect(screen.getByText('Google Reviews')).toBeInTheDocument()
    })
  })

  it('renders "All Reviews" title without filter', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockReviews),
    })

    render(<ReviewList />)

    await waitFor(() => {
      expect(screen.getByText('All Reviews')).toBeInTheDocument()
    })
  })

  it('shows response status badges', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockReviews),
    })

    render(<ReviewList />)

    await waitFor(() => {
      expect(screen.getByText('pending')).toBeInTheDocument()
      expect(screen.getByText('review')).toBeInTheDocument()
    })
  })

  it('shows star ratings', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockReviews),
    })

    render(<ReviewList />)

    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument()
    })

    // Check star ratings are rendered (aria-labels)
    const starRatings = screen.getAllByLabelText(/out of 5 stars/)
    expect(starRatings.length).toBe(2)
  })
})
