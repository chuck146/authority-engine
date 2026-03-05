import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ReviewRequestList } from '../review-request-list'
import { buildReviewRequestListItem } from '@/tests/factories'

// Mock the detail sheet
vi.mock('../review-request-detail-sheet', () => ({
  ReviewRequestDetailSheet: () => <div data-testid="detail-sheet" />,
}))

describe('ReviewRequestList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state', () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}))
    render(<ReviewRequestList />)

    // Should show skeleton loaders
    const container = document.querySelector('.animate-pulse')
    expect(container).toBeInTheDocument()
  })

  it('renders list of requests', async () => {
    const items = [
      buildReviewRequestListItem({ id: 'rr-1', customerName: 'John Smith' }),
      buildReviewRequestListItem({
        id: 'rr-2',
        customerName: 'Jane Doe',
        status: 'sent',
        channel: 'sms',
      }),
    ]

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(items),
    })

    render(<ReviewRequestList />)

    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument()
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    })
  })

  it('shows empty state when no requests', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })

    render(<ReviewRequestList />)

    await waitFor(() => {
      expect(screen.getByText(/No review requests yet/)).toBeInTheDocument()
    })
  })

  it('shows error state on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Forbidden' }),
    })

    render(<ReviewRequestList />)

    await waitFor(() => {
      expect(screen.getByText(/Failed to load review requests/)).toBeInTheDocument()
    })
  })

  it('displays status badges', async () => {
    const items = [
      buildReviewRequestListItem({ id: 'rr-1', status: 'pending' }),
      buildReviewRequestListItem({ id: 'rr-2', status: 'sent' }),
    ]

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(items),
    })

    render(<ReviewRequestList />)

    await waitFor(() => {
      expect(screen.getByText('pending')).toBeInTheDocument()
      expect(screen.getByText('sent')).toBeInTheDocument()
    })
  })
})
