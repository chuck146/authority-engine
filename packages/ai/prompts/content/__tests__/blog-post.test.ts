import { describe, it, expect } from 'vitest'
import { buildBlogPostPrompt } from '../blog-post'
import { buildOrgContext } from '@/tests/factories'
import type { BlogPostInput } from '@/types/content'

const baseInput: BlogPostInput = {
  contentType: 'blog_post',
  topic: 'How to Choose Paint Colors for Your Living Room',
  tone: 'friendly',
  targetWordCount: 800,
}

describe('buildBlogPostPrompt', () => {
  it('returns system and user strings', () => {
    const result = buildBlogPostPrompt(baseInput, buildOrgContext())
    expect(result).toHaveProperty('system')
    expect(result).toHaveProperty('user')
  })

  it('includes targetWordCount in system prompt', () => {
    const result = buildBlogPostPrompt(baseInput, buildOrgContext())
    expect(result.system).toContain('800')
  })

  it('includes topic in user prompt', () => {
    const result = buildBlogPostPrompt(baseInput, buildOrgContext())
    expect(result.user).toContain('How to Choose Paint Colors for Your Living Room')
  })

  it('includes category in system prompt when provided', () => {
    const input: BlogPostInput = { ...baseInput, category: 'Tips & Guides' }
    const result = buildBlogPostPrompt(input, buildOrgContext())
    expect(result.system).toContain('Tips & Guides')
  })

  it('omits category when not provided', () => {
    const result = buildBlogPostPrompt(baseInput, buildOrgContext())
    expect(result.system).not.toContain('Category context:')
  })

  it('includes tone in system prompt', () => {
    const result = buildBlogPostPrompt(baseInput, buildOrgContext())
    expect(result.system).toContain('friendly')
  })
})
