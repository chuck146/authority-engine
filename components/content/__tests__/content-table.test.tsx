import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContentTable } from '../content-table'
import { buildContentListItem } from '@/tests/factories'

const defaultProps = {
  userRole: 'admin' as const,
  onSelectItem: vi.fn(),
}

describe('ContentTable', () => {
  describe('empty state', () => {
    it('shows empty message when no items', () => {
      render(<ContentTable items={[]} {...defaultProps} />)
      expect(screen.getByText('No content yet')).toBeInTheDocument()
      expect(screen.getByText(/Switch to the Generate tab/)).toBeInTheDocument()
    })

    it('does not render a table', () => {
      render(<ContentTable items={[]} {...defaultProps} />)
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })

  describe('populated state', () => {
    it('renders table headers', () => {
      render(<ContentTable items={[buildContentListItem()]} {...defaultProps} />)
      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Type')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('SEO Score')).toBeInTheDocument()
      expect(screen.getByText('Created')).toBeInTheDocument()
    })

    it('renders item title', () => {
      render(<ContentTable items={[buildContentListItem({ title: 'My Service Page' })]} {...defaultProps} />)
      expect(screen.getByText('My Service Page')).toBeInTheDocument()
    })

    it('renders type label as badge', () => {
      render(<ContentTable items={[buildContentListItem({ type: 'location_page' })]} {...defaultProps} />)
      expect(screen.getByText('Location Page')).toBeInTheDocument()
    })

    it('renders status as badge', () => {
      render(<ContentTable items={[buildContentListItem({ status: 'published' })]} {...defaultProps} />)
      expect(screen.getByText('published')).toBeInTheDocument()
    })

    it('renders SEO score with /100 suffix', () => {
      render(<ContentTable items={[buildContentListItem({ seoScore: 85 })]} {...defaultProps} />)
      expect(screen.getByText('85/100')).toBeInTheDocument()
    })

    it('renders -- for null SEO score', () => {
      render(<ContentTable items={[buildContentListItem({ seoScore: null })]} {...defaultProps} />)
      expect(screen.getByText('--')).toBeInTheDocument()
    })

    it('formats date correctly', () => {
      render(<ContentTable items={[buildContentListItem({ createdAt: '2026-03-01T12:00:00Z' })]} {...defaultProps} />)
      expect(screen.getByText('Mar 1, 2026')).toBeInTheDocument()
    })

    it('renders multiple items', () => {
      const items = [
        buildContentListItem({ id: '1', title: 'Page One' }),
        buildContentListItem({ id: '2', title: 'Page Two' }),
      ]
      render(<ContentTable items={items} {...defaultProps} />)
      expect(screen.getByText('Page One')).toBeInTheDocument()
      expect(screen.getByText('Page Two')).toBeInTheDocument()
    })
  })
})
