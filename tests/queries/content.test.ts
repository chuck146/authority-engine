import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '../mocks/supabase'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/static', () => ({
  createStaticClient: vi.fn(),
}))

const mockClient = createMockSupabaseClient()

import { createClient } from '@/lib/supabase/server'
import { createStaticClient } from '@/lib/supabase/static'

import {
  getAllPublishedServiceSlugs,
  getAllPublishedLocationSlugs,
  getAllPublishedBlogSlugs,
  getPublishedServicePage,
  getPublishedCommercialServicePage,
} from '@/lib/queries/content'

describe('single-page queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createStaticClient).mockReturnValue(mockClient as never)
    mockClient.from.mockReturnValue(mockClient)
    mockClient.select.mockReturnValue(mockClient)
    mockClient.eq.mockReturnValue(mockClient)
    mockClient.returns.mockReturnValue(mockClient)
  })

  it('scopes service page lookups to the organization', async () => {
    mockClient.single.mockResolvedValueOnce({ data: { slug: 'interior-painting' }, error: null })

    await getPublishedServicePage('org-1', 'interior-painting')

    expect(mockClient.eq).toHaveBeenCalledWith('organization_id', 'org-1')
    expect(mockClient.eq).toHaveBeenCalledWith('slug', 'interior-painting')
    expect(mockClient.eq).toHaveBeenCalledWith('status', 'published')
  })

  it('scopes commercial page lookups to the organization', async () => {
    mockClient.single.mockResolvedValueOnce({ data: null, error: null })

    const result = await getPublishedCommercialServicePage('org-1', 'office')

    expect(mockClient.from).toHaveBeenCalledWith('commercial_service_pages')
    expect(mockClient.eq).toHaveBeenCalledWith('organization_id', 'org-1')
    expect(result).toBeNull()
  })

  it('uses the cookie-free client so marketing pages can be statically cached', async () => {
    mockClient.single.mockResolvedValueOnce({ data: null, error: null })

    await getPublishedServicePage('org-1', 'interior-painting')

    expect(createStaticClient).toHaveBeenCalled()
    expect(createClient).not.toHaveBeenCalled()
  })
})

describe('bulk slug queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockClient as never)
    vi.mocked(createStaticClient).mockReturnValue(mockClient as never)
    mockClient.from.mockReturnValue(mockClient)
    mockClient.select.mockReturnValue(mockClient)
    mockClient.eq.mockReturnValue(mockClient)
    mockClient.returns.mockReturnValue(mockClient)
  })

  describe('getAllPublishedServiceSlugs', () => {
    it('returns published service slugs', async () => {
      const slugs = [
        { slug: 'interior-painting', updated_at: '2026-03-01T00:00:00Z' },
        { slug: 'exterior-painting', updated_at: '2026-03-02T00:00:00Z' },
      ]
      mockClient.returns.mockResolvedValueOnce({ data: slugs, error: null })

      const result = await getAllPublishedServiceSlugs('org-1')

      expect(mockClient.from).toHaveBeenCalledWith('service_pages')
      expect(mockClient.select).toHaveBeenCalledWith('slug, updated_at')
      expect(mockClient.eq).toHaveBeenCalledWith('organization_id', 'org-1')
      expect(mockClient.eq).toHaveBeenCalledWith('status', 'published')
      expect(result).toEqual(slugs)
    })

    it('returns empty array when no data', async () => {
      mockClient.returns.mockResolvedValueOnce({ data: null, error: null })

      const result = await getAllPublishedServiceSlugs('org-1')
      expect(result).toEqual([])
    })
  })

  describe('getAllPublishedLocationSlugs', () => {
    it('returns published location slugs', async () => {
      const slugs = [{ slug: 'summit-nj', updated_at: '2026-03-01T00:00:00Z' }]
      mockClient.returns.mockResolvedValueOnce({ data: slugs, error: null })

      const result = await getAllPublishedLocationSlugs('org-1')

      expect(mockClient.from).toHaveBeenCalledWith('location_pages')
      expect(mockClient.select).toHaveBeenCalledWith('slug, updated_at')
      expect(mockClient.eq).toHaveBeenCalledWith('organization_id', 'org-1')
      expect(mockClient.eq).toHaveBeenCalledWith('status', 'published')
      expect(result).toEqual(slugs)
    })

    it('returns empty array when no data', async () => {
      mockClient.returns.mockResolvedValueOnce({ data: null, error: null })

      const result = await getAllPublishedLocationSlugs('org-1')
      expect(result).toEqual([])
    })
  })

  describe('getAllPublishedBlogSlugs', () => {
    it('returns published blog slugs', async () => {
      const slugs = [{ slug: 'choose-right-paint-color', updated_at: '2026-03-01T00:00:00Z' }]
      mockClient.returns.mockResolvedValueOnce({ data: slugs, error: null })

      const result = await getAllPublishedBlogSlugs('org-1')

      expect(mockClient.from).toHaveBeenCalledWith('blog_posts')
      expect(mockClient.select).toHaveBeenCalledWith('slug, updated_at')
      expect(mockClient.eq).toHaveBeenCalledWith('organization_id', 'org-1')
      expect(mockClient.eq).toHaveBeenCalledWith('status', 'published')
      expect(result).toEqual(slugs)
    })

    it('returns empty array when no data', async () => {
      mockClient.returns.mockResolvedValueOnce({ data: null, error: null })

      const result = await getAllPublishedBlogSlugs('org-1')
      expect(result).toEqual([])
    })
  })
})
