import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalendarListView } from '@/components/calendar/calendar-list-view'
import { buildCalendarViewItem } from '@/tests/factories'

describe('CalendarListView', () => {
  const mockOnEntryClick = vi.fn()

  it('renders empty state when no items', () => {
    render(<CalendarListView items={[]} onEntryClick={mockOnEntryClick} />)
    expect(screen.getByText('No scheduled content for this month.')).toBeInTheDocument()
  })

  it('renders items grouped by date', () => {
    const items = [
      buildCalendarViewItem({
        id: 'cal-1',
        contentTitle: 'Interior Painting',
        scheduledAt: '2026-03-15T10:00:00Z',
      }),
      buildCalendarViewItem({
        id: 'cal-2',
        contentTitle: 'Exterior Painting',
        scheduledAt: '2026-03-15T14:00:00Z',
      }),
      buildCalendarViewItem({
        id: 'cal-3',
        contentTitle: 'Summit NJ',
        scheduledAt: '2026-03-20T09:00:00Z',
      }),
    ]

    render(<CalendarListView items={items} onEntryClick={mockOnEntryClick} />)

    expect(screen.getByText('Interior Painting')).toBeInTheDocument()
    expect(screen.getByText('Exterior Painting')).toBeInTheDocument()
    expect(screen.getByText('Summit NJ')).toBeInTheDocument()
  })

  it('shows content type and status badges', () => {
    const items = [
      buildCalendarViewItem({
        contentType: 'blog_post',
        status: 'scheduled',
        scheduledAt: '2026-03-15T10:00:00Z',
      }),
    ]

    render(<CalendarListView items={items} onEntryClick={mockOnEntryClick} />)

    expect(screen.getByText('Blog')).toBeInTheDocument()
    expect(screen.getByText('Scheduled')).toBeInTheDocument()
  })

  it('calls onEntryClick when an item is clicked', async () => {
    const user = userEvent.setup()
    const item = buildCalendarViewItem({
      contentTitle: 'Clickable Item',
      scheduledAt: '2026-03-15T10:00:00Z',
    })

    render(<CalendarListView items={[item]} onEntryClick={mockOnEntryClick} />)

    await user.click(screen.getByText('Clickable Item'))
    expect(mockOnEntryClick).toHaveBeenCalledWith(item)
  })

  it('sorts items chronologically', () => {
    const items = [
      buildCalendarViewItem({
        id: 'cal-2',
        contentTitle: 'Later Item',
        scheduledAt: '2026-03-20T10:00:00Z',
      }),
      buildCalendarViewItem({
        id: 'cal-1',
        contentTitle: 'Earlier Item',
        scheduledAt: '2026-03-10T10:00:00Z',
      }),
    ]

    render(<CalendarListView items={items} onEntryClick={mockOnEntryClick} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).toHaveTextContent('Earlier Item')
    expect(buttons[1]).toHaveTextContent('Later Item')
  })
})
