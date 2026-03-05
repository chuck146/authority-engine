import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CalendarGrid } from '@/components/calendar/calendar-grid'
import { buildCalendarViewItem } from '@/tests/factories'

function renderWithProviders(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>)
}

describe('CalendarGrid', () => {
  it('renders weekday headers', () => {
    renderWithProviders(<CalendarGrid items={[]} month={3} year={2026} />)

    expect(screen.getByText('Sun')).toBeInTheDocument()
    expect(screen.getByText('Mon')).toBeInTheDocument()
    expect(screen.getByText('Sat')).toBeInTheDocument()
  })

  it('renders days of the month', () => {
    renderWithProviders(<CalendarGrid items={[]} month={3} year={2026} />)

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

    renderWithProviders(<CalendarGrid items={[item]} month={3} year={2026} />)

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

    renderWithProviders(<CalendarGrid items={items} month={3} year={2026} />)

    expect(screen.getByText('+2 more')).toBeInTheDocument()
  })

  it('renders empty grid when no items', () => {
    const { container } = renderWithProviders(<CalendarGrid items={[]} month={4} year={2026} />)

    // Should have day cells (at least 28 for April)
    const dayCells = container.querySelectorAll('.min-h-\\[100px\\]')
    expect(dayCells.length).toBeGreaterThanOrEqual(28)
  })

  it('calls onEntryClick when an entry is clicked', async () => {
    const user = userEvent.setup()
    const onEntryClick = vi.fn()
    const item = buildCalendarViewItem({
      contentTitle: 'Clickable Entry',
      scheduledAt: '2026-03-15T10:00:00Z',
    })

    renderWithProviders(
      <CalendarGrid items={[item]} month={3} year={2026} onEntryClick={onEntryClick} />,
    )

    await user.click(screen.getByText('Clickable Entry'))
    expect(onEntryClick).toHaveBeenCalledWith(item)
  })

  it('shows all entries in popover when +N more is clicked', async () => {
    const user = userEvent.setup()
    const items = Array.from({ length: 5 }, (_, i) =>
      buildCalendarViewItem({
        id: `cal-${i}`,
        contentTitle: `Page ${i}`,
        scheduledAt: '2026-03-10T10:00:00Z',
      }),
    )

    renderWithProviders(<CalendarGrid items={items} month={3} year={2026} />)

    await user.click(screen.getByText('+2 more'))

    // Popover should show all 5 entries (not just overflow)
    const allPageTexts = screen.getAllByText(/^Page \d$/)
    expect(allPageTexts.length).toBeGreaterThanOrEqual(5)
  })
})
