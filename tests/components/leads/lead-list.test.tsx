import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { LeadList } from '@/components/leads/lead-list'
import { buildLeadListItem } from '@/tests/factories'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('LeadList', () => {
  it('shows loading state initially', () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {})) // never resolves
    render(<LeadList />)
    expect(screen.getByText('Loading leads...')).toBeDefined()
  })

  it('renders table with lead data', async () => {
    const items = [
      buildLeadListItem({ id: 'lead-1', name: 'Jane Doe', service: 'Interior Painting' }),
      buildLeadListItem({ id: 'lead-2', name: 'John Smith', service: 'Deck Staining' }),
    ]
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items, total: 2, page: 1, limit: 25 }),
    })

    await act(async () => {
      render(<LeadList />)
    })

    expect(screen.getByText('Jane Doe')).toBeDefined()
    expect(screen.getByText('John Smith')).toBeDefined()
    expect(screen.getByText('Interior Painting')).toBeDefined()
  })

  it('shows empty state when no leads', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [], total: 0, page: 1, limit: 25 }),
    })

    await act(async () => {
      render(<LeadList />)
    })

    expect(screen.getByText(/No leads yet/)).toBeDefined()
  })

  it('renders search input and filter selects', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [], total: 0, page: 1, limit: 25 }),
    })

    await act(async () => {
      render(<LeadList />)
    })

    expect(screen.getByPlaceholderText('Search name, email, phone...')).toBeDefined()
  })
})
