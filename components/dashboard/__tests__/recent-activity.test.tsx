import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecentActivity } from '../recent-activity'
import { buildRecentActivityItem } from '@/tests/factories'

describe('RecentActivity', () => {
  it('renders activity items with type badges', () => {
    const items = [
      buildRecentActivityItem({ id: '1', contentType: 'service_page', title: 'Interior Painting' }),
      buildRecentActivityItem({ id: '2', contentType: 'location_page', title: 'Summit, NJ' }),
      buildRecentActivityItem({ id: '3', contentType: 'blog_post', title: 'Color Tips' }),
    ]

    render(<RecentActivity items={items} />)

    expect(screen.getByText('Interior Painting')).toBeInTheDocument()
    expect(screen.getByText('Summit, NJ')).toBeInTheDocument()
    expect(screen.getByText('Color Tips')).toBeInTheDocument()
    expect(screen.getByText('Service')).toBeInTheDocument()
    expect(screen.getByText('Location')).toBeInTheDocument()
    expect(screen.getByText('Blog')).toBeInTheDocument()
  })

  it('shows empty state when no items', () => {
    render(<RecentActivity items={[]} />)

    expect(screen.getByText('No published content yet.')).toBeInTheDocument()
  })

  it('renders relative timestamps', () => {
    const items = [
      buildRecentActivityItem({
        id: '1',
        publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
      }),
    ]

    render(<RecentActivity items={items} />)

    expect(screen.getByText('30m ago')).toBeInTheDocument()
  })

  it('renders all provided items', () => {
    const items = Array.from({ length: 8 }, (_, i) =>
      buildRecentActivityItem({ id: `item-${i}`, title: `Page ${i}` }),
    )

    render(<RecentActivity items={items} />)

    for (let i = 0; i < 8; i++) {
      expect(screen.getByText(`Page ${i}`)).toBeInTheDocument()
    }
  })
})
