import type {
  Organization,
  ServicePage,
  LocationPage,
  BlogPost,
  OrgBranding,
  OrgSettings,
  OrgContactInfo,
} from '@/types'
import type { StructuredContent } from '@/types/content'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cleanestpaintingnj.com'

type BreadcrumbItem = { label: string; href?: string }

export function buildBreadcrumbSchema(
  items: BreadcrumbItem[]
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href && { item: `${BASE_URL}${item.href}` }),
    })),
  }
}

function buildBusinessSchema(
  org: Organization
): Record<string, unknown> {
  const branding = org.branding as unknown as OrgBranding | null
  const settings = org.settings as unknown as OrgSettings | null
  const contact = settings?.contact_info as OrgContactInfo | undefined

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    name: org.name,
    url: BASE_URL,
    ...(org.logo_url && { logo: org.logo_url }),
    ...(branding?.tagline && { description: branding.tagline }),
    ...(contact?.phone && { telephone: contact.phone }),
    ...(contact?.email && { email: contact.email }),
  }

  if (contact?.address) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: contact.address.streetAddress,
      addressLocality: contact.address.city,
      addressRegion: contact.address.state,
      postalCode: contact.address.postalCode,
      addressCountry: contact.address.country ?? 'US',
    }
  }

  if (settings?.service_area_counties && settings.service_area_counties.length > 0) {
    schema.areaServed = settings.service_area_counties.map((county) => ({
      '@type': 'AdministrativeArea',
      name: `${county} County, ${settings.service_area_states?.[0] ?? 'NJ'}`,
    }))
  }

  return schema
}

export function buildServicePageSchemas(
  page: ServicePage,
  org: Organization
): Record<string, unknown>[] {
  const content = page.content as unknown as StructuredContent

  const businessSchema = buildBusinessSchema(org)

  const serviceSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: page.title,
    description: content.meta_description,
    url: `${BASE_URL}/services/${page.slug}`,
    provider: {
      '@type': 'HomeAndConstructionBusiness',
      name: org.name,
      url: BASE_URL,
    },
  }

  const breadcrumbSchema = buildBreadcrumbSchema([
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services' },
    { label: page.title },
  ])

  return [businessSchema, serviceSchema, breadcrumbSchema]
}

export function buildLocationPageSchemas(
  page: LocationPage,
  org: Organization
): Record<string, unknown>[] {
  const content = page.content as unknown as StructuredContent

  const businessSchema = buildBusinessSchema(org)

  // Add geo coordinates if available
  if (page.latitude && page.longitude) {
    businessSchema.geo = {
      '@type': 'GeoCoordinates',
      latitude: page.latitude,
      longitude: page.longitude,
    }
  }

  // Override areaServed with specific city
  businessSchema.areaServed = {
    '@type': 'City',
    name: `${page.city}, ${page.state}`,
  }

  const serviceSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Painting Services in ${page.city}, ${page.state}`,
    description: content.meta_description,
    url: `${BASE_URL}/locations/${page.slug}`,
    areaServed: {
      '@type': 'City',
      name: `${page.city}, ${page.state}`,
    },
    provider: {
      '@type': 'HomeAndConstructionBusiness',
      name: org.name,
      url: BASE_URL,
    },
  }

  const breadcrumbSchema = buildBreadcrumbSchema([
    { label: 'Home', href: '/' },
    { label: 'Locations', href: '/locations' },
    { label: `${page.city}, ${page.state}` },
  ])

  return [businessSchema, serviceSchema, breadcrumbSchema]
}

export function buildBlogPostSchemas(
  post: BlogPost,
  org: Organization
): Record<string, unknown>[] {
  const content = post.content as unknown as StructuredContent

  const articleSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: content.headline ?? post.title,
    description: content.meta_description ?? post.excerpt,
    url: `${BASE_URL}/blog/${post.slug}`,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Organization',
      name: org.name,
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: org.name,
      url: BASE_URL,
      ...(org.logo_url && {
        logo: {
          '@type': 'ImageObject',
          url: org.logo_url,
        },
      }),
    },
    ...(post.featured_image_url && { image: post.featured_image_url }),
    ...(post.category && { articleSection: post.category }),
    ...(post.tags && post.tags.length > 0 && { keywords: post.tags.join(', ') }),
  }

  const breadcrumbSchema = buildBreadcrumbSchema([
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: post.title },
  ])

  return [articleSchema, breadcrumbSchema]
}
