import type { RelatedBlogLink } from '@/types'

const STOP_WORDS = new Set(['painting', 'services', 'service', 'and', 'nj'])

// Pick blog posts that share a topic word with a service slug
// (e.g. "deck-staining" → posts mentioning "deck" or "staining"). Only topically
// matching posts are returned so "Related Articles" is never just "recent".
export function pickRelatedPosts(
  posts: RelatedBlogLink[],
  serviceSlug: string,
  limit = 2,
): RelatedBlogLink[] {
  const terms = serviceSlug
    .toLowerCase()
    .split('-')
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t))
  if (terms.length === 0) return []

  return posts
    .map((post) => {
      const text = `${post.slug} ${post.title} ${post.excerpt ?? ''}`.toLowerCase()
      return { post, score: terms.filter((t) => text.includes(t)).length }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.post)
}
