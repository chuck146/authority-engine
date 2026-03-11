import { describe, it, expect, vi } from 'vitest'
import {
  buildBreadcrumbSchema,
  buildServicePageSchemas,
  buildLocationPageSchemas,
  buildBlogPostSchemas,
} from '@/lib/seo/json-ld'
import type { Organization, ServicePage, LocationPage, BlogPost } from '@/types'

vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://cleanestpaintingnj.com')

function buildMockOrg(overrides?: Partial<Organization>): Organization {
  return {
    id: 'org-1',
    name: 'Cleanest Painting LLC',
    slug: 'cleanest-painting',
    domain: 'cleanestpaintingnj.com',
    logo_url: 'https://example.com/logo.png',
    plan: 'pro',
    branding: {
      primary: '#1a472a',
      secondary: '#fbbf24',
      accent: '#1e3a5f',
      tagline: 'Where Artistry Meets Craftsmanship',
    },
    settings: {
      service_area_states: ['NJ'],
      service_area_counties: ['Union', 'Essex', 'Morris'],
      contact_info: {
        phone: '(732) 496-4607',
        email: 'home@cleanestpaintingnj.com',
      },
    },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as Organization
}

function buildMockServicePage(overrides?: Partial<ServicePage>): ServicePage {
  return {
    id: 'sp-1',
    organization_id: 'org-1',
    title: 'Interior Painting Services',
    slug: 'interior-painting',
    status: 'published',
    content: {
      headline: 'Expert Interior Painting',
      intro: 'Transform your home.',
      sections: [],
      cta: 'Get a free estimate',
      meta_title: 'Interior Painting | Cleanest Painting NJ',
      meta_description: 'Professional interior painting in NJ.',
    },
    meta_title: 'Interior Painting | Cleanest Painting NJ',
    meta_description: 'Professional interior painting in NJ.',
    keywords: ['interior painting'],
    seo_score: 90,
    created_by: 'user-1',
    published_at: '2026-03-01T00:00:00Z',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...overrides,
  } as ServicePage
}

function buildMockLocationPage(overrides?: Partial<LocationPage>): LocationPage {
  return {
    id: 'lp-1',
    organization_id: 'org-1',
    title: 'Painting Services in Summit, NJ',
    slug: 'summit-nj-painting',
    city: 'Summit',
    state: 'NJ',
    zip_codes: ['07901', '07902'],
    latitude: 40.7157,
    longitude: -74.3593,
    status: 'published',
    content: {
      headline: "Summit's Trusted Painters",
      intro: 'Serving the Summit community.',
      sections: [],
      cta: 'Get a free estimate',
      meta_title: 'Painting Services in Summit, NJ',
      meta_description: 'Top-rated painting in Summit, NJ.',
    },
    meta_title: 'Painting Services in Summit, NJ',
    meta_description: 'Top-rated painting in Summit, NJ.',
    keywords: ['painting summit nj'],
    seo_score: 90,
    created_by: 'user-1',
    published_at: '2026-03-01T00:00:00Z',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...overrides,
  } as LocationPage
}

function buildMockBlogPost(overrides?: Partial<BlogPost>): BlogPost {
  return {
    id: 'bp-1',
    organization_id: 'org-1',
    title: 'How to Choose Paint Colors',
    slug: 'choose-right-paint-color',
    excerpt: 'Expert tips for choosing paint.',
    category: 'Tips & Guides',
    tags: ['paint colors', 'interior design'],
    featured_image_url: 'https://example.com/blog-img.jpg',
    reading_time_minutes: 6,
    status: 'published',
    content: {
      headline: 'How to Choose the Right Paint Color',
      intro: 'Choosing paint can be overwhelming.',
      sections: [],
      cta: 'Book a consultation',
      meta_title: 'How to Choose Paint Colors | Cleanest Painting',
      meta_description: 'Expert tips for choosing the perfect paint color.',
    },
    meta_title: 'How to Choose Paint Colors | Cleanest Painting',
    meta_description: 'Expert tips for choosing the perfect paint color.',
    keywords: ['paint colors'],
    seo_score: 88,
    created_by: 'user-1',
    published_at: '2026-03-01T00:00:00Z',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-02T00:00:00Z',
    ...overrides,
  } as BlogPost
}

describe('buildBreadcrumbSchema', () => {
  it('generates valid BreadcrumbList schema', () => {
    const result = buildBreadcrumbSchema([
      { label: 'Home', href: '/' },
      { label: 'Services', href: '/services' },
      { label: 'Interior Painting' },
    ])

    expect(result['@context']).toBe('https://schema.org')
    expect(result['@type']).toBe('BreadcrumbList')
    const items = result.itemListElement as Array<Record<string, unknown>>
    expect(items).toHaveLength(3)
    expect(items[0]).toMatchObject({ position: 1, name: 'Home', item: 'https://cleanestpaintingnj.com/' })
    expect(items[1]).toMatchObject({ position: 2, name: 'Services' })
    expect(items[2]).toMatchObject({ position: 3, name: 'Interior Painting' })
    // Last item (current page) should not have an item URL
    expect(items[2]).not.toHaveProperty('item')
  })
})

describe('buildServicePageSchemas', () => {
  it('returns 3 schemas: business, service, breadcrumb', () => {
    const schemas = buildServicePageSchemas(buildMockServicePage(), buildMockOrg())
    expect(schemas).toHaveLength(3)
    expect(schemas[0]!['@type']).toBe('HomeAndConstructionBusiness')
    expect(schemas[1]!['@type']).toBe('Service')
    expect(schemas[2]!['@type']).toBe('BreadcrumbList')
  })

  it('includes org contact info in business schema', () => {
    const schemas = buildServicePageSchemas(buildMockServicePage(), buildMockOrg())
    const business = schemas[0]!
    expect(business.telephone).toBe('(732) 496-4607')
    expect(business.email).toBe('home@cleanestpaintingnj.com')
  })

  it('includes service area in business schema', () => {
    const schemas = buildServicePageSchemas(buildMockServicePage(), buildMockOrg())
    const business = schemas[0]!
    const areas = business.areaServed as Array<Record<string, unknown>>
    expect(areas).toHaveLength(3)
    expect(areas[0]).toMatchObject({ '@type': 'AdministrativeArea', name: 'Union County, NJ' })
  })

  it('includes correct service URL', () => {
    const schemas = buildServicePageSchemas(buildMockServicePage(), buildMockOrg())
    expect(schemas[1]!.url).toBe('https://cleanestpaintingnj.com/services/interior-painting')
  })

  it('handles org without contact info gracefully', () => {
    const org = buildMockOrg({ settings: {} })
    const schemas = buildServicePageSchemas(buildMockServicePage(), org)
    expect(schemas[0]).not.toHaveProperty('telephone')
    expect(schemas[0]).not.toHaveProperty('email')
  })
})

describe('buildLocationPageSchemas', () => {
  it('returns 3 schemas: business, service, breadcrumb', () => {
    const schemas = buildLocationPageSchemas(buildMockLocationPage(), buildMockOrg())
    expect(schemas).toHaveLength(3)
    expect(schemas[0]!['@type']).toBe('HomeAndConstructionBusiness')
    expect(schemas[1]!['@type']).toBe('Service')
    expect(schemas[2]!['@type']).toBe('BreadcrumbList')
  })

  it('includes geo coordinates', () => {
    const schemas = buildLocationPageSchemas(buildMockLocationPage(), buildMockOrg())
    const geo = schemas[0]!.geo as Record<string, unknown>
    expect(geo['@type']).toBe('GeoCoordinates')
    expect(geo.latitude).toBe(40.7157)
    expect(geo.longitude).toBe(-74.3593)
  })

  it('overrides areaServed with specific city', () => {
    const schemas = buildLocationPageSchemas(buildMockLocationPage(), buildMockOrg())
    const area = schemas[0]!.areaServed as Record<string, unknown>
    expect(area['@type']).toBe('City')
    expect(area.name).toBe('Summit, NJ')
  })

  it('skips geo when latitude/longitude are null', () => {
    const page = buildMockLocationPage({ latitude: null, longitude: null })
    const schemas = buildLocationPageSchemas(page, buildMockOrg())
    expect(schemas[0]).not.toHaveProperty('geo')
  })
})

describe('buildBlogPostSchemas', () => {
  it('returns 2 schemas: article, breadcrumb', () => {
    const schemas = buildBlogPostSchemas(buildMockBlogPost(), buildMockOrg())
    expect(schemas).toHaveLength(2)
    expect(schemas[0]!['@type']).toBe('Article')
    expect(schemas[1]!['@type']).toBe('BreadcrumbList')
  })

  it('includes article metadata', () => {
    const schemas = buildBlogPostSchemas(buildMockBlogPost(), buildMockOrg())
    const article = schemas[0]!
    expect(article.headline).toBe('How to Choose the Right Paint Color')
    expect(article.datePublished).toBe('2026-03-01T00:00:00Z')
    expect(article.dateModified).toBe('2026-03-02T00:00:00Z')
    expect(article.image).toBe('https://example.com/blog-img.jpg')
    expect(article.articleSection).toBe('Tips & Guides')
    expect(article.keywords).toBe('paint colors, interior design')
  })

  it('includes publisher with logo', () => {
    const schemas = buildBlogPostSchemas(buildMockBlogPost(), buildMockOrg())
    const publisher = schemas[0]!.publisher as Record<string, unknown>
    expect(publisher.name).toBe('Cleanest Painting LLC')
    const logo = publisher.logo as Record<string, unknown>
    expect(logo.url).toBe('https://example.com/logo.png')
  })

  it('handles post without featured image or tags', () => {
    const post = buildMockBlogPost({ featured_image_url: null, tags: null })
    const schemas = buildBlogPostSchemas(post, buildMockOrg())
    expect(schemas[0]).not.toHaveProperty('image')
    expect(schemas[0]).not.toHaveProperty('keywords')
  })
})
