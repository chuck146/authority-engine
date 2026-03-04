import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContentPreview } from '../content-preview'
import { buildStructuredContent } from '@/tests/factories'

const defaultContent = buildStructuredContent()
const defaultProps = {
  content: defaultContent,
  title: 'Interior Painting',
  contentType: 'service_page' as const,
}

describe('ContentPreview', () => {
  it('renders the preview title', () => {
    render(<ContentPreview {...defaultProps} />)
    expect(screen.getByText('Preview: Interior Painting')).toBeInTheDocument()
  })

  it('renders the content type badge', () => {
    render(<ContentPreview {...defaultProps} />)
    expect(screen.getByText('Service Page')).toBeInTheDocument()
  })

  it('renders the review status badge', () => {
    render(<ContentPreview {...defaultProps} />)
    expect(screen.getByText('review')).toBeInTheDocument()
  })

  it('renders meta title and description', () => {
    render(<ContentPreview {...defaultProps} />)
    expect(screen.getByText(defaultContent.meta_title)).toBeInTheDocument()
    expect(screen.getByText(defaultContent.meta_description)).toBeInTheDocument()
  })

  it('renders headline as h1', () => {
    render(<ContentPreview {...defaultProps} />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(defaultContent.headline)
  })

  it('renders each section title as h2', () => {
    render(<ContentPreview {...defaultProps} />)
    const headings = screen.getAllByRole('heading', { level: 2 })
    expect(headings).toHaveLength(2)
    expect(headings[0]).toHaveTextContent('Why Choose Us')
    expect(headings[1]).toHaveTextContent('Our Process')
  })

  it('renders section body HTML', () => {
    render(<ContentPreview {...defaultProps} />)
    expect(screen.getByText('We deliver exceptional results with premium materials.')).toBeInTheDocument()
  })

  it('renders the CTA block', () => {
    render(<ContentPreview {...defaultProps} />)
    expect(screen.getByText(defaultContent.cta)).toBeInTheDocument()
  })

  it('shows correct label for different content types', () => {
    const { rerender } = render(<ContentPreview {...defaultProps} contentType="blog_post" />)
    expect(screen.getByText('Blog Post')).toBeInTheDocument()

    rerender(<ContentPreview {...defaultProps} contentType="location_page" />)
    expect(screen.getByText('Location Page')).toBeInTheDocument()
  })
})
