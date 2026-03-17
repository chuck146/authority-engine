import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SocialPostPreview } from '@/components/social/social-post-preview'
import { buildSocialPostDetail } from '@/tests/factories'

describe('SocialPostPreview', () => {
  it('renders GBP preview with post body', () => {
    const post = buildSocialPostDetail({ platform: 'gbp', body: 'Hello GBP world' })
    render(<SocialPostPreview post={post} />)
    expect(screen.getByText('Hello GBP world')).toBeDefined()
    expect(screen.getByText('Business Update')).toBeDefined()
  })

  it('renders Instagram preview with hashtags', () => {
    const post = buildSocialPostDetail({
      platform: 'instagram',
      body: 'IG post',
      hashtags: ['painting', 'spring'],
    })
    render(<SocialPostPreview post={post} />)
    expect(screen.getByText('IG post')).toBeDefined()
    expect(screen.getByText('#painting #spring')).toBeDefined()
  })

  it('renders Facebook preview', () => {
    const post = buildSocialPostDetail({ platform: 'facebook', body: 'FB post' })
    render(<SocialPostPreview post={post} />)
    expect(screen.getByText('FB post')).toBeDefined()
    expect(screen.getByText('Facebook Post')).toBeDefined()
  })

  it('overrides body in preview', () => {
    const post = buildSocialPostDetail({ platform: 'gbp', body: 'Original' })
    render(<SocialPostPreview post={post} overrides={{ body: 'Overridden body' }} />)
    expect(screen.getByText('Overridden body')).toBeDefined()
    expect(screen.queryByText('Original')).toBeNull()
  })

  it('overrides hashtags in Instagram preview', () => {
    const post = buildSocialPostDetail({
      platform: 'instagram',
      hashtags: ['old'],
    })
    render(<SocialPostPreview post={post} overrides={{ hashtags: ['new', 'tags'] }} />)
    expect(screen.getByText('#new #tags')).toBeDefined()
  })

  it('overrides CTA type in GBP preview', () => {
    const post = buildSocialPostDetail({ platform: 'gbp', ctaType: 'BOOK' })
    render(<SocialPostPreview post={post} overrides={{ ctaType: 'CALL' }} />)
    expect(screen.getByText('CALL')).toBeDefined()
  })

  it('removes CTA when overridden to null', () => {
    const post = buildSocialPostDetail({ platform: 'gbp', ctaType: 'BOOK' })
    render(<SocialPostPreview post={post} overrides={{ ctaType: null }} />)
    expect(screen.queryByText('BOOK')).toBeNull()
  })

  it('renders image when mediaUrl provided via overrides', () => {
    const post = buildSocialPostDetail({ platform: 'gbp', mediaUrl: null })
    render(
      <SocialPostPreview post={post} overrides={{ mediaUrl: 'https://example.com/image.jpg' }} />,
    )
    const img = screen.getByAltText('Post image') as HTMLImageElement
    expect(img.src).toBe('https://example.com/image.jpg')
  })

  it('does not render image when mediaUrl is null', () => {
    const post = buildSocialPostDetail({ platform: 'gbp', mediaUrl: null })
    render(<SocialPostPreview post={post} />)
    expect(screen.queryByAltText('Post image')).toBeNull()
  })

  it('character count updates with overridden body', () => {
    const post = buildSocialPostDetail({ platform: 'gbp', body: 'Short' })
    render(<SocialPostPreview post={post} overrides={{ body: 'A longer replacement body text' }} />)
    expect(screen.getByText('30 / 1,500 characters')).toBeDefined()
  })
})
