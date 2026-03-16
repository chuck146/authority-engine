import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { LeadPipelineView } from '@/components/leads/lead-pipeline-view'
import { buildLeadListItem } from '@/tests/factories'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('LeadPipelineView', () => {
  it('shows loading state initially', () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}))
    render(<LeadPipelineView />)
    expect(screen.getByText('Loading pipeline...')).toBeDefined()
  })

  it('renders pipeline columns with leads', async () => {
    const items = [
      buildLeadListItem({ id: 'lead-1', name: 'Alice', status: 'new' }),
      buildLeadListItem({ id: 'lead-2', name: 'Bob', status: 'contacted' }),
      buildLeadListItem({ id: 'lead-3', name: 'Charlie', status: 'won' }),
    ]
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items, total: 3, page: 1, limit: 50 }),
    })

    await act(async () => {
      render(<LeadPipelineView />)
    })

    // Column headers
    expect(screen.getByText('New')).toBeDefined()
    expect(screen.getByText('Contacted')).toBeDefined()
    expect(screen.getByText('Won')).toBeDefined()

    // Lead names
    expect(screen.getByText('Alice')).toBeDefined()
    expect(screen.getByText('Bob')).toBeDefined()
    expect(screen.getByText('Charlie')).toBeDefined()
  })

  it('shows "No leads" in empty columns', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [], total: 0, page: 1, limit: 50 }),
    })

    await act(async () => {
      render(<LeadPipelineView />)
    })

    const noLeadsTexts = screen.getAllByText('No leads')
    expect(noLeadsTexts.length).toBe(6) // all 6 columns empty
  })
})
