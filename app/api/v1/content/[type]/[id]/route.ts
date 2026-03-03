import { NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { contentTypeSchema, type ContentType, type ContentDetail } from '@/types/content'
import type { ContentStatus, Json } from '@/types'

type RouteParams = {
  params: Promise<{ type: string; id: string }>
}

const TABLE_MAP: Record<ContentType, string> = {
  service_page: 'service_pages',
  location_page: 'location_pages',
  blog_post: 'blog_posts',
}

type ContentRow = {
  id: string
  title: string
  slug: string
  status: ContentStatus
  content: Json
  seo_score: number | null
  keywords: string[]
  meta_title: string | null
  meta_description: string | null
  approved_by: string | null
  approved_at: string | null
  rejection_note: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { type, id } = await params

    const typeResult = contentTypeSchema.safeParse(type)
    if (!typeResult.success) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }

    const auth = await requireApiAuth()
    const supabase = await createClient()
    const tableName = TABLE_MAP[typeResult.data]

    const { data, error } = await supabase
      .from(tableName)
      .select(
        'id, title, slug, status, content, seo_score, keywords, meta_title, meta_description, approved_by, approved_at, rejection_note, published_at, created_at, updated_at',
      )
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .returns<ContentRow[]>()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    const detail: ContentDetail = {
      id: data.id,
      type: typeResult.data,
      title: data.title,
      slug: data.slug,
      status: data.status,
      content: data.content as unknown as ContentDetail['content'],
      seoScore: data.seo_score,
      keywords: data.keywords,
      metaTitle: data.meta_title,
      metaDescription: data.meta_description,
      approvedBy: data.approved_by,
      approvedAt: data.approved_at,
      rejectionNote: data.rejection_note,
      publishedAt: data.published_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return NextResponse.json(detail)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Content Detail Error]', err)
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 })
  }
}
