import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReviewsPageClient } from '../reviews-page-client'

// Mock child components
vi.mock('../review-list', () => ({
  ReviewList: ({ platform }: { platform?: string }) => (
    <div data-testid={`review-list-${platform ?? 'all'}`}>Review List ({platform ?? 'all'})</div>
  ),
}))

vi.mock('../review-entry-form', () => ({
  ReviewEntryForm: ({ onCreated: _onCreated }: { onCreated?: () => void }) => (
    <div data-testid="entry-form">Entry Form</div>
  ),
}))

vi.mock('../review-overview-cards', () => ({
  ReviewOverviewCards: () => <div data-testid="overview-cards">Overview Cards</div>,
}))

vi.mock('../review-request-form', () => ({
  ReviewRequestForm: ({ onCreated: _onCreated }: { onCreated?: () => void }) => (
    <div data-testid="request-form">Request Form</div>
  ),
}))

vi.mock('../review-request-list', () => ({
  ReviewRequestList: () => <div data-testid="request-list">Request List</div>,
}))

describe('ReviewsPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all tabs', () => {
    render(<ReviewsPageClient />)

    expect(screen.getByRole('tab', { name: 'All Reviews' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Google' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Yelp' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Angi/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Manual' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Add Review' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Request Reviews' })).toBeInTheDocument()
  })

  it('shows All Reviews tab content by default', () => {
    render(<ReviewsPageClient />)

    expect(screen.getByTestId('review-list-all')).toBeInTheDocument()
  })
})
