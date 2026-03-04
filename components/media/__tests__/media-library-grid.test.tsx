import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MediaLibraryGrid } from '../media-library-grid'
import { buildMediaLibraryItem } from '@/tests/factories'

describe('MediaLibraryGrid', () => {
  const mockOnSelectItem = vi.fn()

  it('shows loading skeleton when loading', () => {
    render(<MediaLibraryGrid items={[]} loading={true} onSelectItem={mockOnSelectItem} />)

    // Should render skeleton cards (animated pulse divs)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows empty state when no items', () => {
    render(<MediaLibraryGrid items={[]} loading={false} onSelectItem={mockOnSelectItem} />)

    expect(screen.getByText('No images yet')).toBeInTheDocument()
    expect(screen.getByText(/generate your first image/i)).toBeInTheDocument()
  })

  it('renders image cards for items', () => {
    const items = [
      buildMediaLibraryItem({ id: '1', filename: 'blog-colors.png' }),
      buildMediaLibraryItem({ id: '2', filename: 'hero-summit.png', imageType: 'location_hero' }),
    ]

    render(<MediaLibraryGrid items={items} loading={false} onSelectItem={mockOnSelectItem} />)

    expect(screen.getByText('blog-colors.png')).toBeInTheDocument()
    expect(screen.getByText('hero-summit.png')).toBeInTheDocument()
  })

  it('shows image type badge', () => {
    const items = [buildMediaLibraryItem({ imageType: 'blog_thumbnail' })]

    render(<MediaLibraryGrid items={items} loading={false} onSelectItem={mockOnSelectItem} />)

    expect(screen.getByText('Blog Thumbnail')).toBeInTheDocument()
  })

  it('calls onSelectItem when card is clicked', async () => {
    const user = userEvent.setup()
    const item = buildMediaLibraryItem()

    render(<MediaLibraryGrid items={[item]} loading={false} onSelectItem={mockOnSelectItem} />)

    await user.click(screen.getByText(item.filename))

    expect(mockOnSelectItem).toHaveBeenCalledWith(item)
  })

  it('shows file size in KB', () => {
    const items = [buildMediaLibraryItem({ sizeBytes: 204800 })]

    render(<MediaLibraryGrid items={items} loading={false} onSelectItem={mockOnSelectItem} />)

    expect(screen.getByText('200 KB')).toBeInTheDocument()
  })
})
