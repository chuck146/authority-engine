import { createClient } from '@/lib/supabase/server'
import { createStaticClient } from '@/lib/supabase/static'
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

export async function getPublishedServicePage(slug: string): Promise<ServicePage | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('service_pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .returns<ServicePage[]>()
    .single()
  return data
}

export async function getPublishedLocationPage(slug: string): Promise<LocationPage | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('location_pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .returns<LocationPage[]>()
    .single()
  return data
}

export async function getPublishedBlogPost(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .returns<BlogPost[]>()
    .single()
  return data
}

type ContentSlug = { slug: string; updated_at: string }

export async function getAllPublishedServiceSlugs(): Promise<ContentSlug[]> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('service_pages')
    .select('slug, updated_at')
    .eq('status', 'published')
    .returns<ContentSlug[]>()
  return data ?? []
}

export async function getAllPublishedLocationSlugs(): Promise<ContentSlug[]> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('location_pages')
    .select('slug, updated_at')
    .eq('status', 'published')
    .returns<ContentSlug[]>()
  return data ?? []
}

export async function getAllPublishedBlogSlugs(): Promise<ContentSlug[]> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, updated_at')
    .eq('status', 'published')
    .returns<ContentSlug[]>()
  return data ?? []
}

// --- Organization queries ---

export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .returns<Organization[]>()
    .single()
  return data
}

export async function getOrganizationById(id: string): Promise<Organization | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .returns<Organization[]>()
    .single()
  return data
}

// --- Related content queries (for cross-linking) ---

export async function getRelatedServicePages(
  orgId: string,
  excludeSlug: string,
  limit = 3,
): Promise<RelatedServiceLink[]> {
  const supabase = await createClient()
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
  const supabase = await createClient()
  const { data } = await supabase
    .from('service_pages')
    .select('slug, title')
    .eq('organization_id', orgId)
    .eq('status', 'published')
    .returns<RelatedServiceLink[]>()
  return data ?? []
}

export async function getAllPublishedLocationLinks(orgId: string): Promise<RelatedLocationLink[]> {
  const supabase = await createClient()
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
  const supabase = await createClient()
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
  const supabase = await createClient()
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
  const supabase = await createClient()
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
  const supabase = await createClient()
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
  const supabase = await createClient()
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
  slug: string,
): Promise<CommercialServicePage | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('commercial_service_pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .returns<CommercialServicePage[]>()
    .single()
  return data
}

export async function getAllPublishedCommercialServiceSlugs(): Promise<ContentSlug[]> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('commercial_service_pages')
    .select('slug, updated_at')
    .eq('status', 'published')
    .returns<ContentSlug[]>()
  return data ?? []
}

export async function getAllPublishedCommercialServiceCards(
  orgId: string,
): Promise<CommercialServiceCardLink[]> {
  const supabase = await createClient()
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
  const supabase = await createClient()
  const { data } = await supabase
    .from('commercial_service_pages')
    .select('slug, title')
    .eq('organization_id', orgId)
    .eq('status', 'published')
    .returns<RelatedServiceLink[]>()
  return data ?? []
}
