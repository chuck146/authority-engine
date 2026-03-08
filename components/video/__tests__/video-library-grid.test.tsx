import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VideoLibraryGrid } from '../video-library-grid'
import { buildVideoLibraryItem } from '@/tests/factories'

describe('VideoLibraryGrid', () => {
  it('shows loading skeleton', () => {
    render(<VideoLibraryGrid items={[]} loading={true} onSelectItem={vi.fn()} />)

    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows empty state when no videos', () => {
    render(<VideoLibraryGrid items={[]} loading={false} onSelectItem={vi.fn()} />)

    expect(screen.getByText('No videos yet')).toBeDefined()
  })

  it('renders video cards', () => {
    const items = [
      buildVideoLibraryItem({ filename: 'my-video.mp4' }),
      buildVideoLibraryItem({ id: 'video-2', filename: 'second-video.mp4' }),
    ]

    render(<VideoLibraryGrid items={items} loading={false} onSelectItem={vi.fn()} />)

    expect(screen.getByText('my-video.mp4')).toBeDefined()
    expect(screen.getByText('second-video.mp4')).toBeDefined()
  })

  it('shows duration badge', () => {
    const items = [buildVideoLibraryItem({ durationSeconds: 8 })]

    render(<VideoLibraryGrid items={items} loading={false} onSelectItem={vi.fn()} />)

    expect(screen.getByText('8s')).toBeDefined()
  })

  it('shows video type badge', () => {
    const items = [buildVideoLibraryItem({ videoType: 'project_showcase' })]

    render(<VideoLibraryGrid items={items} loading={false} onSelectItem={vi.fn()} />)

    expect(screen.getByText('Project Showcase')).toBeDefined()
  })

  it('calls onSelectItem when card clicked', () => {
    const onSelect = vi.fn()
    const item = buildVideoLibraryItem()

    render(<VideoLibraryGrid items={[item]} loading={false} onSelectItem={onSelect} />)

    fireEvent.click(screen.getByText(item.filename))
    expect(onSelect).toHaveBeenCalledWith(item)
  })

  it('shows file size', () => {
    const items = [buildVideoLibraryItem({ sizeBytes: 5242880 })]

    render(<VideoLibraryGrid items={items} loading={false} onSelectItem={vi.fn()} />)

    expect(screen.getByText('5.0 MB')).toBeDefined()
  })
})
