import type { MetadataRoute } from 'next'

import {
  getAllPublishedServiceSlugs,
  getAllPublishedCommercialServiceSlugs,
  getAllPublishedLocationSlugs,
  getAllPublishedBlogSlugs,
} from '@/lib/queries/content'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cleanestpaintingnj.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, commercialServices, locations, blogs] = await Promise.all([
    getAllPublishedServiceSlugs(),
    getAllPublishedCommercialServiceSlugs(),
    getAllPublishedLocationSlugs(),
    getAllPublishedBlogSlugs(),
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
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/services`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/commercial`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/locations`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...serviceEntries,
    ...commercialServiceEntries,
    ...locationEntries,
    ...blogEntries,
  ]
}
