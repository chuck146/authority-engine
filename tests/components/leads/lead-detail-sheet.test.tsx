import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { LeadDetailSheet } from '@/components/leads/lead-detail-sheet'
import { buildLeadDetail } from '@/tests/factories'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('LeadDetailSheet', () => {
  const defaultProps = {
    leadId: 'lead-1',
    open: true,
    onOpenChange: vi.fn(),
    onUpdated: vi.fn(),
  }

  it('shows loading state when open', () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}))
    render(<LeadDetailSheet {...defaultProps} />)
    expect(screen.getByText('Loading...')).toBeDefined()
  })

  it('renders lead details', async () => {
    const detail = buildLeadDetail({
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '(201) 555-1234',
      service: 'Interior Painting',
      source: 'website',
    })
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(detail),
    })

    await act(async () => {
      render(<LeadDetailSheet {...defaultProps} />)
    })

    expect(screen.getByText('Jane Doe')).toBeDefined()
    expect(screen.getByText('Interior Painting')).toBeDefined()
    expect(screen.getByText('jane@example.com')).toBeDefined()
    expect(screen.getByText('(201) 555-1234')).toBeDefined()
  })

  it('renders activity timeline', async () => {
    const detail = buildLeadDetail({
      activities: [
        {
          id: 'act-1',
          activityType: 'status_change',
          description: 'Status changed from new to contacted',
          metadata: {},
          createdBy: 'user-123',
          createdAt: '2026-03-16T13:00:00Z',
        },
      ],
    })
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(detail),
    })

    await act(async () => {
      render(<LeadDetailSheet {...defaultProps} />)
    })

    expect(screen.getByText('Activity')).toBeDefined()
    expect(screen.getByText('Status changed from new to contacted')).toBeDefined()
  })

  it('renders action buttons for new lead', async () => {
    const detail = buildLeadDetail({ status: 'new' })
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(detail),
    })

    await act(async () => {
      render(<LeadDetailSheet {...defaultProps} />)
    })

    expect(screen.getByText('Mark Contacted')).toBeDefined()
    expect(screen.getByText('Qualify')).toBeDefined()
  })
})
