import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SeoContentList } from '../seo-content-list'
import type { SeoContentItem } from '@/types/seo'

function buildSeoItem(overrides?: Partial<SeoContentItem>): SeoContentItem {
  return {
    id: 'sp-1',
    contentType: 'service_page',
    title: 'Interior Painting',
    slug: 'interior-painting',
    status: 'published',
    seoScore: 72,
    topIssue: 'Meta description is too short.',
    ...overrides,
  }
}

describe('SeoContentList', () => {
  it('shows empty message when no items', () => {
    render(<SeoContentList items={[]} onSelectItem={vi.fn()} />)
    expect(screen.getByText('No content to analyze')).toBeInTheDocument()
  })

  it('renders table with items', () => {
    render(<SeoContentList items={[buildSeoItem()]} onSelectItem={vi.fn()} />)
    expect(screen.getByText('Interior Painting')).toBeInTheDocument()
    expect(screen.getByText('Service Page')).toBeInTheDocument()
    expect(screen.getByText('72/100')).toBeInTheDocument()
  })

  it('renders top issue text', () => {
    render(<SeoContentList items={[buildSeoItem()]} onSelectItem={vi.fn()} />)
    expect(screen.getByText('Meta description is too short.')).toBeInTheDocument()
  })

  it('shows "All checks passed" when no top issue', () => {
    render(<SeoContentList items={[buildSeoItem({ topIssue: null })]} onSelectItem={vi.fn()} />)
    expect(screen.getByText('All checks passed')).toBeInTheDocument()
  })

  it('calls onSelectItem when row is clicked', async () => {
    const onSelect = vi.fn()
    const item = buildSeoItem()
    render(<SeoContentList items={[item]} onSelectItem={onSelect} />)

    await userEvent.click(screen.getByText('Interior Painting'))
    expect(onSelect).toHaveBeenCalledWith(item)
  })

  it('renders multiple items', () => {
    const items = [
      buildSeoItem({ id: '1', title: 'Page One', seoScore: 90 }),
      buildSeoItem({ id: '2', title: 'Page Two', seoScore: 40, contentType: 'blog_post' }),
    ]
    render(<SeoContentList items={items} onSelectItem={vi.fn()} />)
    expect(screen.getByText('Page One')).toBeInTheDocument()
    expect(screen.getByText('Page Two')).toBeInTheDocument()
    expect(screen.getByText('Blog Post')).toBeInTheDocument()
  })
})
