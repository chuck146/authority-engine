import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '../mocks/supabase'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const mockClient = createMockSupabaseClient()

import { createClient } from '@/lib/supabase/server'

import {
  getOrganizationById,
  getRelatedServicePages,
  getAllPublishedServiceLinks,
  getRelatedLocationPages,
  getRelatedBlogPosts,
} from '@/lib/queries/content'

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockClient as never)
  mockClient.from.mockReturnValue(mockClient)
  mockClient.select.mockReturnValue(mockClient)
  mockClient.eq.mockReturnValue(mockClient)
  mockClient.neq.mockReturnValue(mockClient)
  mockClient.order.mockReturnValue(mockClient)
  mockClient.limit.mockReturnValue(mockClient)
  mockClient.returns.mockReturnValue(mockClient)
  mockClient.single.mockResolvedValue({ data: null, error: null })
})

describe('getOrganizationById', () => {
  it('queries organizations table by id', async () => {
    const mockOrg = { id: 'org-1', name: 'Test Org' }
    mockClient.single.mockResolvedValueOnce({ data: mockOrg, error: null })

    const result = await getOrganizationById('org-1')

    expect(mockClient.from).toHaveBeenCalledWith('organizations')
    expect(mockClient.eq).toHaveBeenCalledWith('id', 'org-1')
    expect(result).toEqual(mockOrg)
  })

  it('returns null when not found', async () => {
    mockClient.single.mockResolvedValueOnce({ data: null, error: null })
    const result = await getOrganizationById('missing')
    expect(result).toBeNull()
  })
})

describe('getRelatedServicePages', () => {
  it('queries published services excluding current slug', async () => {
    const mockServices = [{ slug: 'exterior-painting', title: 'Exterior Painting' }]
    // Chain: .from().select().eq().eq().neq().limit().returns()
    mockClient.returns.mockResolvedValueOnce({ data: mockServices, error: null })

    const result = await getRelatedServicePages('org-1', 'interior-painting', 3)

    expect(mockClient.from).toHaveBeenCalledWith('service_pages')
    expect(mockClient.select).toHaveBeenCalledWith('slug, title')
    expect(mockClient.eq).toHaveBeenCalledWith('organization_id', 'org-1')
    expect(mockClient.eq).toHaveBeenCalledWith('status', 'published')
    expect(mockClient.neq).toHaveBeenCalledWith('slug', 'interior-painting')
    expect(mockClient.limit).toHaveBeenCalledWith(3)
    expect(result).toEqual(mockServices)
  })

  it('returns empty array on null data', async () => {
    mockClient.returns.mockResolvedValueOnce({ data: null, error: null })
    const result = await getRelatedServicePages('org-1', 'test', 3)
    expect(result).toEqual([])
  })
})

describe('getAllPublishedServiceLinks', () => {
  it('queries all published services for an org', async () => {
    const mockServices = [
      { slug: 'interior-painting', title: 'Interior Painting' },
      { slug: 'exterior-painting', title: 'Exterior Painting' },
    ]
    mockClient.returns.mockResolvedValueOnce({ data: mockServices, error: null })

    const result = await getAllPublishedServiceLinks('org-1')

    expect(mockClient.from).toHaveBeenCalledWith('service_pages')
    expect(mockClient.eq).toHaveBeenCalledWith('organization_id', 'org-1')
    expect(mockClient.eq).toHaveBeenCalledWith('status', 'published')
    expect(result).toEqual(mockServices)
  })
})

describe('getRelatedLocationPages', () => {
  it('queries published locations excluding current slug', async () => {
    const mockLocations = [
      { slug: 'cranford-nj-painting', title: 'Cranford Painting', city: 'Cranford', state: 'NJ' },
    ]
    // Chain: .from().select().eq().eq().neq().limit().returns()
    mockClient.returns.mockResolvedValueOnce({ data: mockLocations, error: null })

    const result = await getRelatedLocationPages('org-1', 'summit-nj-painting', 4)

    expect(mockClient.from).toHaveBeenCalledWith('location_pages')
    expect(mockClient.select).toHaveBeenCalledWith('slug, title, city, state')
    expect(mockClient.neq).toHaveBeenCalledWith('slug', 'summit-nj-painting')
    expect(mockClient.limit).toHaveBeenCalledWith(4)
    expect(result).toEqual(mockLocations)
  })
})

describe('getRelatedBlogPosts', () => {
  it('queries published blog posts ordered by published_at desc', async () => {
    const mockPosts = [{ slug: 'test-post', title: 'Test', excerpt: 'A post' }]
    // Chain: .from().select().eq().eq().neq().order().limit().returns()
    mockClient.returns.mockResolvedValueOnce({ data: mockPosts, error: null })

    const result = await getRelatedBlogPosts('org-1', 'current-post', 2)

    expect(mockClient.from).toHaveBeenCalledWith('blog_posts')
    expect(mockClient.select).toHaveBeenCalledWith('slug, title, excerpt')
    expect(mockClient.neq).toHaveBeenCalledWith('slug', 'current-post')
    expect(mockClient.order).toHaveBeenCalledWith('published_at', { ascending: false })
    expect(mockClient.limit).toHaveBeenCalledWith(2)
    expect(result).toEqual(mockPosts)
  })

  it('returns empty array on null data', async () => {
    mockClient.returns.mockResolvedValueOnce({ data: null, error: null })
    const result = await getRelatedBlogPosts('org-1', 'test', 2)
    expect(result).toEqual([])
  })
})
