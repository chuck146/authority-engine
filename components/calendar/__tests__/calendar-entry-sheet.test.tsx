import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalendarEntrySheet } from '@/components/calendar/calendar-entry-sheet'
import { buildCalendarViewItem } from '@/tests/factories'

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe('CalendarEntrySheet', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnEntryUpdated = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders entry title and badges', () => {
    const item = buildCalendarViewItem({
      contentTitle: 'Interior Painting',
      contentType: 'service_page',
      status: 'scheduled',
    })

    render(
      <CalendarEntrySheet
        item={item}
        userRole="editor"
        open={true}
        onOpenChange={mockOnOpenChange}
        onEntryUpdated={mockOnEntryUpdated}
      />,
    )

    expect(screen.getByText('Interior Painting')).toBeInTheDocument()
    expect(screen.getByText('Service Page')).toBeInTheDocument()
    expect(screen.getByText('Scheduled')).toBeInTheDocument()
  })

  it('shows scheduled date', () => {
    const item = buildCalendarViewItem({
      scheduledAt: '2026-04-01T10:00:00Z',
    })

    render(
      <CalendarEntrySheet
        item={item}
        userRole="editor"
        open={true}
        onOpenChange={mockOnOpenChange}
        onEntryUpdated={mockOnEntryUpdated}
      />,
    )

    expect(screen.getByText('Scheduled for')).toBeInTheDocument()
  })

  it('shows published date when available', () => {
    const item = buildCalendarViewItem({
      status: 'published',
      publishedAt: '2026-04-01T10:05:00Z',
    })

    render(
      <CalendarEntrySheet
        item={item}
        userRole="editor"
        open={true}
        onOpenChange={mockOnOpenChange}
        onEntryUpdated={mockOnEntryUpdated}
      />,
    )

    expect(screen.getByText('Published at')).toBeInTheDocument()
  })

  it('shows error message for failed entries', () => {
    const item = buildCalendarViewItem({
      status: 'failed',
      errorMessage: 'Content not found during publish',
    })

    render(
      <CalendarEntrySheet
        item={item}
        userRole="editor"
        open={true}
        onOpenChange={mockOnOpenChange}
        onEntryUpdated={mockOnEntryUpdated}
      />,
    )

    expect(screen.getByText('Content not found during publish')).toBeInTheDocument()
  })

  it('shows action buttons for scheduled entries with editor role', () => {
    const item = buildCalendarViewItem({ status: 'scheduled' })

    render(
      <CalendarEntrySheet
        item={item}
        userRole="editor"
        open={true}
        onOpenChange={mockOnOpenChange}
        onEntryUpdated={mockOnEntryUpdated}
      />,
    )

    expect(screen.getByText('Reschedule')).toBeInTheDocument()
    expect(screen.getByText('Cancel Publish')).toBeInTheDocument()
  })

  it('hides action buttons for viewer role', () => {
    const item = buildCalendarViewItem({ status: 'scheduled' })

    render(
      <CalendarEntrySheet
        item={item}
        userRole="viewer"
        open={true}
        onOpenChange={mockOnOpenChange}
        onEntryUpdated={mockOnEntryUpdated}
      />,
    )

    expect(screen.queryByText('Reschedule')).not.toBeInTheDocument()
    expect(screen.queryByText('Cancel Publish')).not.toBeInTheDocument()
  })

  it('hides action buttons for non-scheduled entries', () => {
    const item = buildCalendarViewItem({ status: 'published' })

    render(
      <CalendarEntrySheet
        item={item}
        userRole="editor"
        open={true}
        onOpenChange={mockOnOpenChange}
        onEntryUpdated={mockOnEntryUpdated}
      />,
    )

    expect(screen.queryByText('Reschedule')).not.toBeInTheDocument()
    expect(screen.queryByText('Cancel Publish')).not.toBeInTheDocument()
  })

  it('shows reschedule form when Reschedule is clicked', async () => {
    const user = userEvent.setup()
    const item = buildCalendarViewItem({ status: 'scheduled' })

    render(
      <CalendarEntrySheet
        item={item}
        userRole="editor"
        open={true}
        onOpenChange={mockOnOpenChange}
        onEntryUpdated={mockOnEntryUpdated}
      />,
    )

    await user.click(screen.getByText('Reschedule'))
    expect(screen.getByLabelText('New Date & Time')).toBeInTheDocument()
    expect(screen.getByText('Confirm Reschedule')).toBeInTheDocument()
    expect(screen.getByText('Back')).toBeInTheDocument()
  })

  it('calls cancel API when Cancel Publish is clicked', async () => {
    const user = userEvent.setup()
    const item = buildCalendarViewItem({ id: 'cal-123', status: 'scheduled' })

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })

    render(
      <CalendarEntrySheet
        item={item}
        userRole="editor"
        open={true}
        onOpenChange={mockOnOpenChange}
        onEntryUpdated={mockOnEntryUpdated}
      />,
    )

    await user.click(screen.getByText('Cancel Publish'))

    expect(global.fetch).toHaveBeenCalledWith('/api/v1/calendar/cal-123', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
    expect(mockOnEntryUpdated).toHaveBeenCalled()
  })

  it('renders skeleton when no item', () => {
    render(
      <CalendarEntrySheet
        item={null}
        userRole="editor"
        open={true}
        onOpenChange={mockOnOpenChange}
        onEntryUpdated={mockOnEntryUpdated}
      />,
    )

    // Sheet renders into a portal — query the document body
    expect(document.querySelector('[data-slot="skeleton"]')).toBeInTheDocument()
  })

  it('renders social post type label', () => {
    const item = buildCalendarViewItem({
      contentType: 'social_post',
      contentTitle: 'Spring GBP Update',
    })

    render(
      <CalendarEntrySheet
        item={item}
        userRole="editor"
        open={true}
        onOpenChange={mockOnOpenChange}
        onEntryUpdated={mockOnEntryUpdated}
      />,
    )

    expect(screen.getByText('Social Post')).toBeInTheDocument()
  })
})
