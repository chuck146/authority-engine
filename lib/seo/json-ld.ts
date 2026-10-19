import type {
  Organization,
  ServicePage,
  CommercialServicePage,
  LocationPage,
  BlogPost,
} from '@/types'
import type { StructuredContent } from '@/types/content'
import {
  getBaseUrl,
  getBusinessId,
  getWebsiteId,
  getBusinessProfile,
  formatServiceArea,
} from '@/lib/seo/business'

// Structured data follows a few rules:
// - One business entity (HousePainter) with a stable @id, referenced by every
//   Service/Article node, so all pages describe the same business.
// - Only facts that are also visible on the site (name, contact, city, service
//   area, social profiles). No self-serving ratings/reviews markup, no FAQPage.
// - Absolute URLs everywhere.

type Schema = Record<string, unknown>
type BreadcrumbItem = { label: string; href?: string }

export function buildBreadcrumbSchema(items: BreadcrumbItem[]): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href && { item: `${getBaseUrl()}${item.href}` }),
    })),
  }
}

function businessRef(org: Organization): Schema {
  return { '@type': 'HousePainter', '@id': getBusinessId(), name: org.name }
}

function countyAreas(org: Organization): Schema[] {
  const profile = getBusinessProfile(org)
  return profile.serviceAreaCounties.map((county) => ({
    '@type': 'AdministrativeArea',
    name: `${county} County, ${profile.serviceAreaState}`,
  }))
}

export function buildBusinessSchema(org: Organization): Schema {
  const profile = getBusinessProfile(org)
  const area = formatServiceArea(profile)
  const description = [
    `${profile.name} is a painting contractor`,
    profile.locality && profile.region ? ` based in ${profile.locality}, ${profile.region}` : '',
    area ? `, serving ${area}` : '',
    '.',
  ].join('')

  const schema: Schema = {
    '@context': 'https://schema.org',
    '@type': 'HousePainter',
    '@id': getBusinessId(),
    name: profile.name,
    url: profile.url,
    description,
    ...(profile.logoUrl && { logo: profile.logoUrl, image: profile.logoUrl }),
    ...(profile.tagline && { slogan: profile.tagline }),
    ...(profile.phone && { telephone: profile.phone }),
    ...(profile.email && { email: profile.email }),
    sameAs: profile.sameAs,
  }

  if (profile.locality || profile.postalCode) {
    schema.address = {
      '@type': 'PostalAddress',
      ...(profile.streetAddress && { streetAddress: profile.streetAddress }),
      ...(profile.locality && { addressLocality: profile.locality }),
      ...(profile.region && { addressRegion: profile.region }),
      ...(profile.postalCode && { postalCode: profile.postalCode }),
      addressCountry: profile.country,
    }
  }

  const areas = countyAreas(org)
  if (areas.length > 0) schema.areaServed = areas

  return schema
}

export function buildWebsiteSchema(org: Organization): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': getWebsiteId(),
    url: getBaseUrl(),
    name: org.name,
    publisher: { '@id': getBusinessId() },
  }
}

export function buildHomePageSchemas(org: Organization): Schema[] {
  return [buildBusinessSchema(org), buildWebsiteSchema(org)]
}

function buildServiceSchema(
  org: Organization,
  opts: { name: string; serviceType: string; description?: string | null; path: string },
  areaServed: Schema | Schema[],
): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: opts.name,
    serviceType: opts.serviceType,
    ...(opts.description && { description: opts.description }),
    url: `${getBaseUrl()}${opts.path}`,
    provider: businessRef(org),
    ...((Array.isArray(areaServed) ? areaServed.length > 0 : true) && { areaServed }),
  }
}

export function buildServicePageSchemas(page: ServicePage, org: Organization): Schema[] {
  const content = page.content as unknown as StructuredContent
  const path = `/services/${page.slug}`

  return [
    buildBusinessSchema(org),
    buildServiceSchema(
      org,
      {
        name: page.title,
        serviceType: page.title,
        description: content.meta_description,
        path,
      },
      countyAreas(org),
    ),
    buildBreadcrumbSchema([
      { label: 'Home', href: '/' },
      { label: 'Services', href: '/services' },
      { label: page.title, href: path },
    ]),
  ]
}

export function buildLocationPageSchemas(page: LocationPage, org: Organization): Schema[] {
  const content = page.content as unknown as StructuredContent
  const path = `/locations/${page.slug}`
  const cityName = `${page.city}, ${page.state}`

  // The town is where the service is offered — not where the business is.
  // Keep the business node identical on every page and put the city on the Service.
  const city: Schema = {
    '@type': 'City',
    name: cityName,
    ...(page.latitude &&
      page.longitude && {
        geo: { '@type': 'GeoCoordinates', latitude: page.latitude, longitude: page.longitude },
      }),
  }

  return [
    buildBusinessSchema(org),
    buildServiceSchema(
      org,
      {
        name: `Painting Services in ${cityName}`,
        serviceType: 'House painting',
        description: content.meta_description,
        path,
      },
      city,
    ),
    buildBreadcrumbSchema([
      { label: 'Home', href: '/' },
      { label: 'Locations', href: '/locations' },
      { label: cityName, href: path },
    ]),
  ]
}

export function buildBlogPostSchemas(post: BlogPost, org: Organization): Schema[] {
  const content = post.content as unknown as StructuredContent
  const profile = getBusinessProfile(org)
  const path = `/blog/${post.slug}`

  const articleSchema: Schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: content.headline ?? post.title,
    description: content.meta_description ?? post.excerpt,
    url: `${getBaseUrl()}${path}`,
    mainEntityOfPage: `${getBaseUrl()}${path}`,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { ...businessRef(org), url: getBaseUrl() },
    publisher: {
      ...businessRef(org),
      url: getBaseUrl(),
      ...(profile.logoUrl && { logo: { '@type': 'ImageObject', url: profile.logoUrl } }),
    },
    ...(post.featured_image_url && { image: post.featured_image_url }),
    ...(post.category && { articleSection: post.category }),
    ...(post.tags && post.tags.length > 0 && { keywords: post.tags.join(', ') }),
  }

  return [
    articleSchema,
    buildBreadcrumbSchema([
      { label: 'Home', href: '/' },
      { label: 'Blog', href: '/blog' },
      { label: post.title, href: path },
    ]),
  ]
}

export function buildCommercialServicePageSchemas(
  page: CommercialServicePage,
  org: Organization,
): Schema[] {
  const content = page.content as unknown as StructuredContent
  const path = `/commercial/${page.slug}`

  return [
    buildBusinessSchema(org),
    buildServiceSchema(
      org,
      {
        name: page.title,
        serviceType: 'Commercial painting',
        description: content.meta_description,
        path,
      },
      countyAreas(org),
    ),
    buildBreadcrumbSchema([
      { label: 'Home', href: '/' },
      { label: 'Commercial Services', href: '/commercial' },
      { label: page.title, href: path },
    ]),
  ]
}
