import type { MetadataRoute } from 'next'

import {
  getMarketingOrganization,
  getAllPublishedServiceSlugs,
  getAllPublishedCommercialServiceSlugs,
  getAllPublishedLocationSlugs,
  getAllPublishedBlogSlugs,
} from '@/lib/queries/content'
import { SITE_URL as BASE_URL } from '@/lib/marketing/site'

export const revalidate = 3600

type Dated = { updated_at: string }

// Hub pages change when their children change — use the newest child's
// updated_at instead of "now" so lastmod stays truthful.
function latest(...groups: Dated[][]): string | undefined {
  const times = groups.flat().map((d) => d.updated_at)
  return times.length > 0 ? times.sort().at(-1) : undefined
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const org = await getMarketingOrganization()
  if (!org) return [{ url: BASE_URL }]

  const [services, commercialServices, locations, blogs] = await Promise.all([
    getAllPublishedServiceSlugs(org.id),
    getAllPublishedCommercialServiceSlugs(org.id),
    getAllPublishedLocationSlugs(org.id),
    getAllPublishedBlogSlugs(org.id),
  ])

  const serviceEntries: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${BASE_URL}/services/${s.slug}`,
    lastModified: s.updated_at,
    changeFrequency: 'monthly',
    priority: 0.9,
  }))

  const commercialServiceEntries: MetadataRoute.Sitemap = commercialServices.map((s) => ({
    url: `${BASE_URL}/commercial/${s.slug}`,
    lastModified: s.updated_at,
    changeFrequency: 'monthly',
    priority: 0.85,
  }))

  const locationEntries: MetadataRoute.Sitemap = locations.map((l) => ({
    url: `${BASE_URL}/locations/${l.slug}`,
    lastModified: l.updated_at,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const blogEntries: MetadataRoute.Sitemap = blogs.map((b) => ({
    url: `${BASE_URL}/blog/${b.slug}`,
    lastModified: b.updated_at,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: latest(services, commercialServices, locations, blogs),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/services`,
      lastModified: latest(services),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/commercial`,
      lastModified: latest(commercialServices),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/locations`,
      lastModified: latest(locations),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: latest(blogs),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/estimate`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...serviceEntries,
    ...commercialServiceEntries,
    ...locationEntries,
    ...blogEntries,
  ]
}
