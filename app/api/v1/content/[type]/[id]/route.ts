import { NextResponse } from 'next/server'
import { requireApiAuth, requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { contentTypeSchema, contentEditRequestSchema, type ContentType, type ContentDetail } from '@/types/content'
import type { ContentStatus, Json } from '@/types'

type RouteParams = {
  params: Promise<{ type: string; id: string }>
}

const TABLE_MAP = {
  service_page: 'service_pages',
  location_page: 'location_pages',
  blog_post: 'blog_posts',
} as const satisfies Record<ContentType, string>

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

const EDITABLE_STATUSES: ContentStatus[] = ['draft', 'review']

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { type, id } = await params

    // 1. Validate content type
    const typeResult = contentTypeSchema.safeParse(type)
    if (!typeResult.success) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }

    // 2. Auth: require at least editor role
    const auth = await requireApiRole('editor')

    // 3. Parse and validate request body
    const body = await request.json()
    const parseResult = contentEditRequestSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const input = parseResult.data
    const supabase = await createClient()
    const tableName = TABLE_MAP[typeResult.data]

    // 4. Fetch current record to check status (include content for JSONB meta sync)
    const { data: current, error: fetchError } = await supabase
      .from(tableName)
      .select('id, status, slug, content')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .returns<{ id: string; status: ContentStatus; slug: string; content: Json }[]>()
      .single()

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    // 5. Check status allows editing
    if (!EDITABLE_STATUSES.includes(current.status)) {
      return NextResponse.json(
        { error: `Cannot edit content with status "${current.status}". Archive it first.` },
        { status: 422 },
      )
    }

    // 6. Slug uniqueness check (if slug is being changed)
    if (input.slug && input.slug !== current.slug) {
      const { data: existing } = await supabase
        .from(tableName)
        .select('id')
        .eq('organization_id', auth.organizationId)
        .eq('slug', input.slug)
        .neq('id', id)
        .returns<{ id: string }[]>()
        .maybeSingle()

      if (existing) {
        return NextResponse.json(
          { error: 'A page with this slug already exists.' },
          { status: 409 },
        )
      }
    }

    // 7. Build update payload (camelCase API → snake_case DB)
    const updatePayload: Record<string, unknown> = {}
    if (input.title !== undefined) updatePayload.title = input.title
    if (input.slug !== undefined) updatePayload.slug = input.slug
    if (input.content !== undefined) updatePayload.content = input.content
    if (input.metaTitle !== undefined) updatePayload.meta_title = input.metaTitle
    if (input.metaDescription !== undefined) updatePayload.meta_description = input.metaDescription
    if (input.keywords !== undefined) updatePayload.keywords = input.keywords

    // Sync meta fields into JSONB content (SSR pages read from content.meta_title)
    if (input.metaTitle !== undefined || input.metaDescription !== undefined) {
      const existingContent = (current.content ?? {}) as Record<string, unknown>
      const mergedContent = { ...((updatePayload.content ?? existingContent) as Record<string, unknown>) }
      if (input.metaTitle !== undefined) mergedContent.meta_title = input.metaTitle
      if (input.metaDescription !== undefined) mergedContent.meta_description = input.metaDescription
      updatePayload.content = mergedContent
    }

    // Blog-specific: recalculate excerpt and reading_time if content changed
    if (input.content && typeResult.data === 'blog_post') {
      updatePayload.excerpt = input.content.intro.slice(0, 200)
      const wordCount = [
        input.content.intro,
        ...input.content.sections.map((s) => s.body),
        input.content.cta,
      ]
        .join(' ')
        .split(/\s+/).length
      updatePayload.reading_time_minutes = Math.max(1, Math.ceil(wordCount / 200))
    }

    // 8. Execute update
    const { error: updateError } = await supabase
      .from(tableName)
      .update(updatePayload as never)
      .eq('id', id)
      .eq('organization_id', auth.organizationId)

    if (updateError) throw updateError

    // 9. Refetch and return full detail
    const { data: updated, error: refetchError } = await supabase
      .from(tableName)
      .select(
        'id, title, slug, status, content, seo_score, keywords, meta_title, meta_description, approved_by, approved_at, rejection_note, published_at, created_at, updated_at',
      )
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .returns<ContentRow[]>()
      .single()

    if (refetchError || !updated) throw refetchError ?? new Error('Failed to refetch')

    const detail: ContentDetail = {
      id: updated.id,
      type: typeResult.data,
      title: updated.title,
      slug: updated.slug,
      status: updated.status,
      content: updated.content as unknown as ContentDetail['content'],
      seoScore: updated.seo_score,
      keywords: updated.keywords,
      metaTitle: updated.meta_title,
      metaDescription: updated.meta_description,
      approvedBy: updated.approved_by,
      approvedAt: updated.approved_at,
      rejectionNote: updated.rejection_note,
      publishedAt: updated.published_at,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    }

    return NextResponse.json(detail)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }

    console.error('[Content Edit Error]', err)

    // Handle Supabase unique constraint violations (duplicate slug)
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === '23505'
    ) {
      return NextResponse.json(
        { error: 'A page with this slug already exists.' },
        { status: 409 },
      )
    }

    return NextResponse.json(
      { error: 'Failed to update content. Please try again.' },
      { status: 500 },
    )
  }
}
