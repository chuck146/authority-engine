import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '../mocks/supabase'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const mockClient = createMockSupabaseClient()

import { createClient } from '@/lib/supabase/server'

import {
  getAllPublishedServiceSlugs,
  getAllPublishedLocationSlugs,
  getAllPublishedBlogSlugs,
} from '@/lib/queries/content'

describe('bulk slug queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockClient as never)
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

      const result = await getAllPublishedServiceSlugs()

      expect(mockClient.from).toHaveBeenCalledWith('service_pages')
      expect(mockClient.select).toHaveBeenCalledWith('slug, updated_at')
      expect(mockClient.eq).toHaveBeenCalledWith('status', 'published')
      expect(result).toEqual(slugs)
    })

    it('returns empty array when no data', async () => {
      mockClient.returns.mockResolvedValueOnce({ data: null, error: null })

      const result = await getAllPublishedServiceSlugs()
      expect(result).toEqual([])
    })
  })

  describe('getAllPublishedLocationSlugs', () => {
    it('returns published location slugs', async () => {
      const slugs = [{ slug: 'summit-nj', updated_at: '2026-03-01T00:00:00Z' }]
      mockClient.returns.mockResolvedValueOnce({ data: slugs, error: null })

      const result = await getAllPublishedLocationSlugs()

      expect(mockClient.from).toHaveBeenCalledWith('location_pages')
      expect(mockClient.select).toHaveBeenCalledWith('slug, updated_at')
      expect(mockClient.eq).toHaveBeenCalledWith('status', 'published')
      expect(result).toEqual(slugs)
    })

    it('returns empty array when no data', async () => {
      mockClient.returns.mockResolvedValueOnce({ data: null, error: null })

      const result = await getAllPublishedLocationSlugs()
      expect(result).toEqual([])
    })
  })

  describe('getAllPublishedBlogSlugs', () => {
    it('returns published blog slugs', async () => {
      const slugs = [{ slug: 'choose-right-paint-color', updated_at: '2026-03-01T00:00:00Z' }]
      mockClient.returns.mockResolvedValueOnce({ data: slugs, error: null })

      const result = await getAllPublishedBlogSlugs()

      expect(mockClient.from).toHaveBeenCalledWith('blog_posts')
      expect(mockClient.select).toHaveBeenCalledWith('slug, updated_at')
      expect(mockClient.eq).toHaveBeenCalledWith('status', 'published')
      expect(result).toEqual(slugs)
    })

    it('returns empty array when no data', async () => {
      mockClient.returns.mockResolvedValueOnce({ data: null, error: null })

      const result = await getAllPublishedBlogSlugs()
      expect(result).toEqual([])
    })
  })
})
