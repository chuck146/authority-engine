import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContentPageClient } from '../content-page-client'
import { buildContentListItem } from '@/tests/factories'
import type { ContentListItem } from '@/types/content'

// Mock ContentGenerateForm — tested separately
vi.mock('@/components/content/content-generate-form', () => ({
  ContentGenerateForm: ({ onGenerated }: { onGenerated: (item: ContentListItem) => void }) => (
    <div data-testid="generate-form">
      <button
        onClick={() =>
          onGenerated({
            id: 'new-1',
            type: 'service_page',
            title: 'New Page',
            slug: 'new-page',
            status: 'review',
            seoScore: null,
            createdAt: '2026-03-03T00:00:00Z',
            updatedAt: '2026-03-03T00:00:00Z',
          })
        }
      >
        Mock Generate
      </button>
    </div>
  ),
}))

// Mock ContentDetailSheet — tested separately
vi.mock('@/components/content/content-detail-sheet', () => ({
  ContentDetailSheet: () => <div data-testid="detail-sheet" />,
}))

describe('ContentPageClient', () => {
  const items = [buildContentListItem({ id: '1', title: 'Existing Page' })]

  it('renders All Content tab with item count', () => {
    render(<ContentPageClient initialContent={items} userRole="admin" />)
    expect(screen.getByRole('tab', { name: /All Content \(1\)/ })).toBeInTheDocument()
  })

  it('renders Generate tab', () => {
    render(<ContentPageClient initialContent={items} userRole="admin" />)
    expect(screen.getByRole('tab', { name: /Generate/ })).toBeInTheDocument()
  })

  it('shows content table by default', () => {
    render(<ContentPageClient initialContent={items} userRole="admin" />)
    expect(screen.getByText('Existing Page')).toBeInTheDocument()
  })

  it('switches to Generate tab on click', async () => {
    const user = userEvent.setup()
    render(<ContentPageClient initialContent={items} userRole="admin" />)

    await user.click(screen.getByRole('tab', { name: /Generate/ }))
    expect(screen.getByTestId('generate-form')).toBeInTheDocument()
  })

  it('prepends new item and switches to All tab after generation', async () => {
    const user = userEvent.setup()
    render(<ContentPageClient initialContent={items} userRole="admin" />)

    // Switch to generate tab
    await user.click(screen.getByRole('tab', { name: /Generate/ }))

    // Trigger mock generation
    await user.click(screen.getByText('Mock Generate'))

    // Should switch back to All Content tab with updated count
    expect(screen.getByRole('tab', { name: /All Content \(2\)/ })).toBeInTheDocument()
    expect(screen.getByText('New Page')).toBeInTheDocument()
    expect(screen.getByText('Existing Page')).toBeInTheDocument()
  })

  it('shows empty state when no initial content', () => {
    render(<ContentPageClient initialContent={[]} userRole="admin" />)
    expect(screen.getByRole('tab', { name: /All Content \(0\)/ })).toBeInTheDocument()
    expect(screen.getByText('No content yet')).toBeInTheDocument()
  })
})
