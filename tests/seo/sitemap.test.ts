import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetMarketingOrganization = vi.fn()
const mockServiceSlugs = vi.fn()
const mockCommercialSlugs = vi.fn()
const mockLocationSlugs = vi.fn()
const mockBlogSlugs = vi.fn()

vi.mock('@/lib/queries/content', () => ({
  getMarketingOrganization: () => mockGetMarketingOrganization(),
  getAllPublishedServiceSlugs: (...args: unknown[]) => mockServiceSlugs(...args),
  getAllPublishedCommercialServiceSlugs: (...args: unknown[]) => mockCommercialSlugs(...args),
  getAllPublishedLocationSlugs: (...args: unknown[]) => mockLocationSlugs(...args),
  getAllPublishedBlogSlugs: (...args: unknown[]) => mockBlogSlugs(...args),
}))

import sitemap from '@/app/sitemap'
import { SITE_URL } from '@/lib/marketing/site'

function entry(result: Awaited<ReturnType<typeof sitemap>>, path: string) {
  return result.find((e) => e.url === `${SITE_URL}${path}`)
}

describe('sitemap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetMarketingOrganization.mockResolvedValue({ id: 'org-1', slug: 'cleanest-painting' })
    mockServiceSlugs.mockResolvedValue([
      { slug: 'interior-painting', updated_at: '2026-03-01T00:00:00Z' },
      { slug: 'exterior-painting', updated_at: '2026-05-10T00:00:00Z' },
    ])
    mockCommercialSlugs.mockResolvedValue([])
    mockLocationSlugs.mockResolvedValue([{ slug: 'rahway-nj', updated_at: '2026-04-02T00:00:00Z' }])
    mockBlogSlugs.mockResolvedValue([
      { slug: 'spring-tips', updated_at: '2026-09-15T00:00:00Z' },
      { slug: 'color-trends', updated_at: '2026-01-20T00:00:00Z' },
    ])
  })

  it('returns only the root URL when the marketing org is missing', async () => {
    mockGetMarketingOrganization.mockResolvedValue(null)
    const result = await sitemap()
    expect(result).toEqual([{ url: SITE_URL }])
    expect(mockServiceSlugs).not.toHaveBeenCalled()
  })

  it('scopes every slug query to the marketing org', async () => {
    await sitemap()
    for (const query of [mockServiceSlugs, mockCommercialSlugs, mockLocationSlugs, mockBlogSlugs]) {
      expect(query).toHaveBeenCalledWith('org-1')
    }
  })

  it('uses the newest child updated_at for hub lastModified', async () => {
    const result = await sitemap()
    expect(entry(result, '/services')?.lastModified).toBe('2026-05-10T00:00:00Z')
    expect(entry(result, '/locations')?.lastModified).toBe('2026-04-02T00:00:00Z')
    expect(entry(result, '/blog')?.lastModified).toBe('2026-09-15T00:00:00Z')
    // Homepage: newest across all content
    expect(entry(result, '')?.lastModified).toBe('2026-09-15T00:00:00Z')
  })

  it('leaves hub lastModified undefined when the hub has no children', async () => {
    const result = await sitemap()
    const commercial = entry(result, '/commercial')
    expect(commercial).toBeDefined()
    expect(commercial?.lastModified).toBeUndefined()
  })

  it('leaves the homepage lastModified undefined when no content exists', async () => {
    mockServiceSlugs.mockResolvedValue([])
    mockLocationSlugs.mockResolvedValue([])
    mockBlogSlugs.mockResolvedValue([])
    const result = await sitemap()
    expect(entry(result, '')?.lastModified).toBeUndefined()
  })

  it('includes the /estimate page', async () => {
    const result = await sitemap()
    expect(entry(result, '/estimate')).toBeDefined()
  })

  it('includes child pages with their own lastModified', async () => {
    const result = await sitemap()
    expect(entry(result, '/services/interior-painting')?.lastModified).toBe('2026-03-01T00:00:00Z')
    expect(entry(result, '/locations/rahway-nj')).toBeDefined()
    expect(entry(result, '/blog/spring-tips')).toBeDefined()
  })

  it('emits only absolute, unique URLs', async () => {
    const result = await sitemap()
    const urls = result.map((e) => e.url)
    for (const url of urls) {
      expect(url).toMatch(/^https?:\/\/[^/]+/)
      expect(url.startsWith(SITE_URL)).toBe(true)
    }
    expect(new Set(urls).size).toBe(urls.length)
  })
})
