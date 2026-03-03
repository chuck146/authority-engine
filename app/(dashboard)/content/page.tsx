import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth/guard'
import { createClient } from '@/lib/supabase/server'
import { ContentPageClient } from '@/components/content/content-page-client'
import type { ContentListItem, ContentType } from '@/types/content'
import type { ContentStatus } from '@/types'

export const metadata: Metadata = { title: 'Content' }

type ContentRow = {
  id: string
  title: string
  slug: string
  status: ContentStatus
  seo_score: number | null
  created_at: string
  updated_at: string
}

function mapRows(rows: ContentRow[], type: ContentType): ContentListItem[] {
  return rows.map((p) => ({
    id: p.id,
    type,
    title: p.title,
    slug: p.slug,
    status: p.status,
    seoScore: p.seo_score,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }))
}

export default async function ContentPage() {
  const auth = await requireAuth()
  const supabase = await createClient()

  const [servicePages, locationPages, blogPosts] = await Promise.all([
    supabase
      .from('service_pages')
      .select('id, title, slug, status, seo_score, created_at, updated_at')
      .eq('organization_id', auth.organizationId)
      .order('created_at', { ascending: false })
      .returns<ContentRow[]>(),
    supabase
      .from('location_pages')
      .select('id, title, slug, status, seo_score, created_at, updated_at')
      .eq('organization_id', auth.organizationId)
      .order('created_at', { ascending: false })
      .returns<ContentRow[]>(),
    supabase
      .from('blog_posts')
      .select('id, title, slug, status, seo_score, created_at, updated_at')
      .eq('organization_id', auth.organizationId)
      .order('created_at', { ascending: false })
      .returns<ContentRow[]>(),
  ])

  const allContent: ContentListItem[] = [
    ...mapRows(servicePages.data ?? [], 'service_page'),
    ...mapRows(locationPages.data ?? [], 'location_page'),
    ...mapRows(blogPosts.data ?? [], 'blog_post'),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Engine</h1>
        <p className="text-muted-foreground">
          Generate and manage service pages, location pages, and blog posts.
        </p>
      </div>
      <ContentPageClient initialContent={allContent} userRole={auth.role} />
    </div>
  )
}
