import { createClient } from '@/lib/supabase/server'
import type {
  ServicePage,
  LocationPage,
  BlogPost,
  Organization,
  RelatedServiceLink,
  RelatedLocationLink,
  RelatedBlogLink,
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
  const supabase = await createClient()
  const { data } = await supabase
    .from('service_pages')
    .select('slug, updated_at')
    .eq('status', 'published')
    .returns<ContentSlug[]>()
  return data ?? []
}

export async function getAllPublishedLocationSlugs(): Promise<ContentSlug[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('location_pages')
    .select('slug, updated_at')
    .eq('status', 'published')
    .returns<ContentSlug[]>()
  return data ?? []
}

export async function getAllPublishedBlogSlugs(): Promise<ContentSlug[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, updated_at')
    .eq('status', 'published')
    .returns<ContentSlug[]>()
  return data ?? []
}

// --- Organization query ---

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
