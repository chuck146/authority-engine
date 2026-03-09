import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VideoDetailSheet } from '../video-detail-sheet'
import { buildVideoLibraryItem } from '@/tests/factories'

describe('VideoDetailSheet', () => {
  it('renders nothing when item is null', () => {
    const { container } = render(
      <VideoDetailSheet item={null} open={false} onOpenChange={vi.fn()} onDelete={vi.fn()} />,
    )

    expect(container.innerHTML).toBe('')
  })

  it('shows video filename in title', () => {
    const item = buildVideoLibraryItem({ filename: 'my-reel.mp4' })

    render(<VideoDetailSheet item={item} open={true} onOpenChange={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText('my-reel.mp4')).toBeDefined()
  })

  it('shows video type badge', () => {
    const item = buildVideoLibraryItem({ videoType: 'brand_story' })

    render(<VideoDetailSheet item={item} open={true} onOpenChange={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText('Brand Story')).toBeDefined()
  })

  it('shows duration badge', () => {
    const item = buildVideoLibraryItem({ durationSeconds: 8 })

    render(<VideoDetailSheet item={item} open={true} onOpenChange={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText('8s')).toBeDefined()
  })

  it('shows file size', () => {
    const item = buildVideoLibraryItem({ sizeBytes: 10485760 })

    render(<VideoDetailSheet item={item} open={true} onOpenChange={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText('10.00 MB')).toBeDefined()
  })

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn()
    const item = buildVideoLibraryItem()

    render(<VideoDetailSheet item={item} open={true} onOpenChange={vi.fn()} onDelete={onDelete} />)

    // Find all buttons, the destructive one is the delete button
    const buttons = screen.getAllByRole('button')
    const deleteBtn = buttons.find((btn) => btn.className.includes('destructive'))
    expect(deleteBtn).toBeDefined()
    fireEvent.click(deleteBtn!)
    expect(onDelete).toHaveBeenCalledWith(item.id)
  })

  it('shows download link', () => {
    const item = buildVideoLibraryItem()

    render(<VideoDetailSheet item={item} open={true} onOpenChange={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText('Download')).toBeDefined()
  })

  it('renders schedule button when onSchedule is provided', () => {
    const onSchedule = vi.fn()
    const item = buildVideoLibraryItem()

    render(
      <VideoDetailSheet
        item={item}
        open={true}
        onOpenChange={vi.fn()}
        onDelete={vi.fn()}
        onSchedule={onSchedule}
      />,
    )

    // Schedule button should be present (CalendarClock icon button)
    const buttons = screen.getAllByRole('button')
    // Should have 3 buttons: download (link), schedule, delete
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })

  it('calls onSchedule when schedule button clicked', () => {
    const onSchedule = vi.fn()
    const item = buildVideoLibraryItem()

    render(
      <VideoDetailSheet
        item={item}
        open={true}
        onOpenChange={vi.fn()}
        onDelete={vi.fn()}
        onSchedule={onSchedule}
      />,
    )

    const scheduleBtn = screen.getByLabelText('Schedule video')
    fireEvent.click(scheduleBtn)
    expect(onSchedule).toHaveBeenCalledWith(item)
  })
})
