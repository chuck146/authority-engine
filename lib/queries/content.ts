import { createClient } from '@/lib/supabase/server'
import type { ServicePage, LocationPage, BlogPost } from '@/types'

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
