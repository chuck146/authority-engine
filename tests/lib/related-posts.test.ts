import { describe, it, expect } from 'vitest'
import { pickRelatedPosts } from '@/lib/marketing/related'

const posts = [
  { slug: 'deck-staining-guide-prep-your-deck', title: 'Deck Staining Guide', excerpt: null },
  { slug: 'choose-right-paint-color', title: 'How to Choose Paint Colors', excerpt: 'Undertones' },
  {
    slug: 'signs-exterior-needs-repainting',
    title: 'Signs Your Exterior Needs Repainting',
    excerpt: null,
  },
]

describe('pickRelatedPosts', () => {
  it('returns only topically matching posts', () => {
    expect(pickRelatedPosts(posts, 'deck-staining').map((p) => p.slug)).toEqual([
      'deck-staining-guide-prep-your-deck',
    ])
    expect(pickRelatedPosts(posts, 'exterior-painting').map((p) => p.slug)).toEqual([
      'signs-exterior-needs-repainting',
    ])
  })

  it('returns nothing rather than unrelated posts', () => {
    expect(pickRelatedPosts(posts, 'wallpaper-installation')).toEqual([])
    expect(pickRelatedPosts(posts, 'painting-services')).toEqual([])
  })
})
