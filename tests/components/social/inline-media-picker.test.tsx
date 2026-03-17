import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { InlineMediaPicker } from '@/components/social/inline-media-picker'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('InlineMediaPicker', () => {
  const defaultProps = {
    currentMediaUrl: null,
    onSelect: vi.fn(),
    onRemove: vi.fn(),
  }

  it('shows Attach Image button when no current media', () => {
    render(<InlineMediaPicker {...defaultProps} />)
    expect(screen.getByText('Attach Image')).toBeDefined()
  })

  it('shows thumbnail and Change/Remove when media is set', () => {
    render(<InlineMediaPicker {...defaultProps} currentMediaUrl="https://example.com/img.jpg" />)
    expect(screen.getByText('Change')).toBeDefined()
    expect(screen.getByText('Remove')).toBeDefined()
    const img = screen.getByAltText('Attached') as HTMLImageElement
    expect(img.src).toBe('https://example.com/img.jpg')
  })

  it('clicking Remove calls onRemove', () => {
    const onRemove = vi.fn()
    render(
      <InlineMediaPicker
        {...defaultProps}
        currentMediaUrl="https://example.com/img.jpg"
        onRemove={onRemove}
      />,
    )
    fireEvent.click(screen.getByText('Remove'))
    expect(onRemove).toHaveBeenCalledOnce()
  })

  it('clicking Attach Image opens media grid and fetches media', async () => {
    const mediaItems = [
      { id: 'media-1', publicUrl: 'https://example.com/1.jpg', filename: 'image1.jpg' },
      { id: 'media-2', publicUrl: 'https://example.com/2.jpg', filename: 'image2.jpg' },
    ]

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mediaItems),
    })

    render(<InlineMediaPicker {...defaultProps} />)

    await act(async () => {
      fireEvent.click(screen.getByText('Attach Image'))
    })

    expect(screen.getByText('Select from media library')).toBeDefined()
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(2) // at least 2 image buttons
  })

  it('clicking a media item calls onSelect', async () => {
    const onSelect = vi.fn()
    const mediaItems = [
      { id: 'media-1', publicUrl: 'https://example.com/1.jpg', filename: 'image1.jpg' },
    ]

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mediaItems),
    })

    render(<InlineMediaPicker {...defaultProps} onSelect={onSelect} />)

    await act(async () => {
      fireEvent.click(screen.getByText('Attach Image'))
    })

    const imgButton = screen.getByAltText('image1.jpg').closest('button')!
    await act(async () => {
      fireEvent.click(imgButton)
    })

    expect(onSelect).toHaveBeenCalledWith('media-1', 'https://example.com/1.jpg')
  })

  it('shows empty state when no media items', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })

    render(<InlineMediaPicker {...defaultProps} />)

    await act(async () => {
      fireEvent.click(screen.getByText('Attach Image'))
    })

    expect(screen.getByText(/No images in library/)).toBeDefined()
  })

  it('shows loading skeletons while fetching', async () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {})) // never resolves

    render(<InlineMediaPicker {...defaultProps} />)

    await act(async () => {
      fireEvent.click(screen.getByText('Attach Image'))
    })

    expect(screen.getByText('Select from media library')).toBeDefined()
  })

  it('Cancel button closes the media picker panel', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })

    render(<InlineMediaPicker {...defaultProps} />)

    await act(async () => {
      fireEvent.click(screen.getByText('Attach Image'))
    })

    expect(screen.getByText('Select from media library')).toBeDefined()

    await act(async () => {
      fireEvent.click(screen.getByText('Cancel'))
    })

    expect(screen.queryByText('Select from media library')).toBeNull()
  })
})
