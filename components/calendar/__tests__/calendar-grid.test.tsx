import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CalendarGrid } from '@/components/calendar/calendar-grid'
import { buildCalendarViewItem } from '@/tests/factories'

describe('CalendarGrid', () => {
  it('renders weekday headers', () => {
    render(<CalendarGrid items={[]} month={3} year={2026} />)

    expect(screen.getByText('Sun')).toBeInTheDocument()
    expect(screen.getByText('Mon')).toBeInTheDocument()
    expect(screen.getByText('Sat')).toBeInTheDocument()
  })

  it('renders days of the month', () => {
    render(<CalendarGrid items={[]} month={3} year={2026} />)

    // March 2026 has 31 days — "1" may appear twice (March 1 + overflow April 1)
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('31')).toBeInTheDocument()
  })

  it('renders calendar entries in the correct day', () => {
    const item = buildCalendarViewItem({
      contentTitle: 'My Scheduled Page',
      scheduledAt: '2026-03-15T10:00:00Z',
    })

    render(<CalendarGrid items={[item]} month={3} year={2026} />)

    expect(screen.getByText('My Scheduled Page')).toBeInTheDocument()
  })

  it('shows +N more when more than 3 items on a day', () => {
    const items = Array.from({ length: 5 }, (_, i) =>
      buildCalendarViewItem({
        id: `cal-${i}`,
        contentTitle: `Page ${i}`,
        scheduledAt: '2026-03-10T10:00:00Z',
      }),
    )

    render(<CalendarGrid items={items} month={3} year={2026} />)

    expect(screen.getByText('+2 more')).toBeInTheDocument()
  })

  it('renders empty grid when no items', () => {
    const { container } = render(<CalendarGrid items={[]} month={4} year={2026} />)

    // Should have day cells (at least 28 for April)
    const dayCells = container.querySelectorAll('.min-h-\\[100px\\]')
    expect(dayCells.length).toBeGreaterThanOrEqual(28)
  })
})
