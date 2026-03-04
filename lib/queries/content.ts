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
