import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  RelatedServices,
  RelatedLocations,
  RelatedBlogPosts,
} from '@/components/marketing/related-links'

describe('RelatedServices', () => {
  it('renders service links', () => {
    render(
      <RelatedServices
        services={[
          { slug: 'interior-painting', title: 'Interior Painting' },
          { slug: 'exterior-painting', title: 'Exterior Painting' },
        ]}
      />
    )

    expect(screen.getByText('Related Services')).toBeInTheDocument()
    expect(screen.getByText('Interior Painting')).toBeInTheDocument()
    expect(screen.getByText('Exterior Painting')).toBeInTheDocument()
    expect(screen.getByText('Interior Painting').closest('a')).toHaveAttribute(
      'href',
      '/services/interior-painting'
    )
  })

  it('renders custom heading', () => {
    render(
      <RelatedServices
        services={[{ slug: 'interior-painting', title: 'Interior Painting' }]}
        heading="Our Services"
      />
    )
    expect(screen.getByText('Our Services')).toBeInTheDocument()
  })

  it('renders nothing when empty', () => {
    const { container } = render(<RelatedServices services={[]} />)
    expect(container.innerHTML).toBe('')
  })
})

describe('RelatedLocations', () => {
  it('renders location links with city and state', () => {
    render(
      <RelatedLocations
        locations={[
          { slug: 'summit-nj-painting', title: 'Summit Painting', city: 'Summit', state: 'NJ' },
          { slug: 'cranford-nj-painting', title: 'Cranford Painting', city: 'Cranford', state: 'NJ' },
        ]}
      />
    )

    expect(screen.getByText('We Also Serve')).toBeInTheDocument()
    expect(screen.getByText('Summit, NJ')).toBeInTheDocument()
    expect(screen.getByText('Cranford, NJ')).toBeInTheDocument()
    expect(screen.getByText('Summit, NJ').closest('a')).toHaveAttribute(
      'href',
      '/locations/summit-nj-painting'
    )
  })

  it('renders custom heading', () => {
    render(
      <RelatedLocations
        locations={[
          { slug: 'summit-nj-painting', title: 'Summit Painting', city: 'Summit', state: 'NJ' },
        ]}
        heading="Nearby Areas"
      />
    )
    expect(screen.getByText('Nearby Areas')).toBeInTheDocument()
  })

  it('renders nothing when empty', () => {
    const { container } = render(<RelatedLocations locations={[]} />)
    expect(container.innerHTML).toBe('')
  })
})

describe('RelatedBlogPosts', () => {
  it('renders blog post links with excerpts', () => {
    render(
      <RelatedBlogPosts
        posts={[
          {
            slug: 'choose-right-paint-color',
            title: 'How to Choose Paint Colors',
            excerpt: 'Expert tips for paint selection.',
          },
        ]}
      />
    )

    expect(screen.getByText('Related Articles')).toBeInTheDocument()
    expect(screen.getByText('How to Choose Paint Colors')).toBeInTheDocument()
    expect(screen.getByText('Expert tips for paint selection.')).toBeInTheDocument()
    expect(screen.getByText('How to Choose Paint Colors').closest('a')).toHaveAttribute(
      'href',
      '/blog/choose-right-paint-color'
    )
  })

  it('renders without excerpt when null', () => {
    render(
      <RelatedBlogPosts
        posts={[{ slug: 'test-post', title: 'Test Post', excerpt: null }]}
      />
    )

    expect(screen.getByText('Test Post')).toBeInTheDocument()
  })

  it('renders nothing when empty', () => {
    const { container } = render(<RelatedBlogPosts posts={[]} />)
    expect(container.innerHTML).toBe('')
  })
})
