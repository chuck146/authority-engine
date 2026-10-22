import { cache } from 'react'
import { createStaticClient } from '@/lib/supabase/static'
import { MARKETING_ORG_SLUG } from '@/lib/marketing/site'
import type {
  ServicePage,
  LocationPage,
  BlogPost,
  CommercialServicePage,
  Organization,
  RelatedServiceLink,
  RelatedLocationLink,
  RelatedBlogLink,
  ServiceCardLink,
  CommercialServiceCardLink,
  BlogCardLink,
} from '@/types'

// Public marketing-site reads. They use the cookie-free anon client so pages can
// be statically generated / ISR-cached (cookie access forces dynamic rendering),
// and rely on RLS "published … are public" SELECT policies. Every content query
// is scoped to an organization so another tenant's slugs can't resolve here.

export async function getPublishedServicePage(
  orgId: string,
  slug: string,
): Promise<ServicePage | null> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('service_pages')
    .select('*')
    .eq('organization_id', orgId)
    .eq('slug', slug)
    .eq('status', 'published')
    .returns<ServicePage[]>()
    .single()
  return data
}

export async function getPublishedLocationPage(
  orgId: string,
  slug: string,
): Promise<LocationPage | null> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('location_pages')
    .select('*')
    .eq('organization_id', orgId)
    .eq('slug', slug)
    .eq('status', 'published')
    .returns<LocationPage[]>()
    .single()
  return data
}

export async function getPublishedBlogPost(orgId: string, slug: string): Promise<BlogPost | null> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('organization_id', orgId)
    .eq('slug', slug)
    .eq('status', 'published')
    .returns<BlogPost[]>()
    .single()
  return data
}

type ContentSlug = { slug: string; updated_at: string }

export async function getAllPublishedServiceSlugs(orgId: string): Promise<ContentSlug[]> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('service_pages')
    .select('slug, updated_at')
    .eq('organization_id', orgId)
    .eq('status', 'published')
    .returns<ContentSlug[]>()
  return data ?? []
}

export async function getAllPublishedLocationSlugs(orgId: string): Promise<ContentSlug[]> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('location_pages')
    .select('slug, updated_at')
    .eq('organization_id', orgId)
    .eq('status', 'published')
    .returns<ContentSlug[]>()
  return data ?? []
}

export async function getAllPublishedBlogSlugs(orgId: string): Promise<ContentSlug[]> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, updated_at')
    .eq('organization_id', orgId)
    .eq('status', 'published')
    .returns<ContentSlug[]>()
  return data ?? []
}

// --- Organization queries ---

export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .returns<Organization[]>()
    .single()
  return data
}

export async function getOrganizationById(id: string): Promise<Organization | null> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .returns<Organization[]>()
    .single()
  return data
}

// The organization served on the marketing domain. Deduplicated per render so
// the layout, generateMetadata, and page share one lookup.
export const getMarketingOrganization = cache(
  (): Promise<Organization | null> => getOrganizationBySlug(MARKETING_ORG_SLUG),
)

// --- Related content queries (for cross-linking) ---

export async function getRelatedServicePages(
  orgId: string,
  excludeSlug: string,
  limit = 3,
): Promise<RelatedServiceLink[]> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('service_pages')
    .select('slug, title')
    .eq('organization_id', orgId)
    .eq('status', 'published')
    .neq('slug', excludeSlug)
    .limit(limit)
    .returns<RelatedServiceLink[]>()
  return data ?? []
}

export async function getAllPublishedServiceLinks(orgId: string): Promise<RelatedServiceLink[]> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('service_pages')
    .select('slug, title')
    .eq('organization_id', orgId)
    .eq('status', 'published')
    .returns<RelatedServiceLink[]>()
  return data ?? []
}

export async function getAllPublishedLocationLinks(orgId: string): Promise<RelatedLocationLink[]> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('location_pages')
    .select('slug, title, city, state, county')
    .eq('organization_id', orgId)
    .eq('status', 'published')
    .order('city')
    .returns<RelatedLocationLink[]>()
  return data ?? []
}

export async function getAllPublishedBlogLinks(orgId: string): Promise<RelatedBlogLink[]> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt')
    .eq('organization_id', orgId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .returns<RelatedBlogLink[]>()
  return data ?? []
}

// --- Hub page card queries (richer data for /services and /blog hubs) ---

export async function getAllPublishedServiceCards(orgId: string): Promise<ServiceCardLink[]> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('service_pages')
    .select('slug, title, hero_image_url, content')
    .eq('organization_id', orgId)
    .eq('status', 'published')
    .order('title')
    .returns<ServiceCardLink[]>()
  return data ?? []
}

export async function getAllPublishedBlogCards(orgId: string): Promise<BlogCardLink[]> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt, featured_image_url, published_at')
    .eq('organization_id', orgId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .returns<BlogCardLink[]>()
  return data ?? []
}

export async function getRelatedLocationPages(
  orgId: string,
  excludeSlug: string,
  limit = 4,
): Promise<RelatedLocationLink[]> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('location_pages')
    .select('slug, title, city, state')
    .eq('organization_id', orgId)
    .eq('status', 'published')
    .neq('slug', excludeSlug)
    .limit(limit)
    .returns<RelatedLocationLink[]>()
  return data ?? []
}

export async function getRelatedBlogPosts(
  orgId: string,
  excludeSlug: string,
  limit = 2,
): Promise<RelatedBlogLink[]> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt')
    .eq('organization_id', orgId)
    .eq('status', 'published')
    .neq('slug', excludeSlug)
    .order('published_at', { ascending: false })
    .limit(limit)
    .returns<RelatedBlogLink[]>()
  return data ?? []
}

// --- Commercial service page queries ---

export async function getPublishedCommercialServicePage(
  orgId: string,
  slug: string,
): Promise<CommercialServicePage | null> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('commercial_service_pages')
    .select('*')
    .eq('organization_id', orgId)
    .eq('slug', slug)
    .eq('status', 'published')
    .returns<CommercialServicePage[]>()
    .single()
  return data
}

export async function getAllPublishedCommercialServiceSlugs(orgId: string): Promise<ContentSlug[]> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('commercial_service_pages')
    .select('slug, updated_at')
    .eq('organization_id', orgId)
    .eq('status', 'published')
    .returns<ContentSlug[]>()
  return data ?? []
}

export async function getAllPublishedCommercialServiceCards(
  orgId: string,
): Promise<CommercialServiceCardLink[]> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('commercial_service_pages')
    .select('slug, title, hero_image_url, content')
    .eq('organization_id', orgId)
    .eq('status', 'published')
    .order('title')
    .returns<CommercialServiceCardLink[]>()
  return data ?? []
}

export async function getAllPublishedCommercialServiceLinks(
  orgId: string,
): Promise<RelatedServiceLink[]> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('commercial_service_pages')
    .select('slug, title')
    .eq('organization_id', orgId)
    .eq('status', 'published')
    .returns<RelatedServiceLink[]>()
  return data ?? []
}
