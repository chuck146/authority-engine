import { NextResponse } from 'next/server'
import { requireApiAuth, requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { socialPostEditSchema } from '@/types/social'
import type { SocialPostDetail, SocialPlatform } from '@/types/social'
import type { ContentStatus } from '@/types'

type RouteParams = {
  params: Promise<{ id: string }>
}

type SocialPostRow = {
  id: string
  platform: string
  post_type: string
  title: string | null
  body: string
  hashtags: string[]
  cta_type: string | null
  cta_url: string | null
  media_asset_id: string | null
  status: string
  keywords: string[]
  metadata: Record<string, unknown>
  published_at: string | null
  created_at: string
  updated_at: string
}

const EDITABLE_STATUSES: ContentStatus[] = ['draft', 'review']

function rowToDetail(row: SocialPostRow, mediaUrl: string | null): SocialPostDetail {
  return {
    id: row.id,
    platform: row.platform as SocialPlatform,
    postType: row.post_type,
    title: row.title,
    body: row.body,
    hashtags: row.hashtags ?? [],
    ctaType: row.cta_type,
    ctaUrl: row.cta_url,
    mediaAssetId: row.media_asset_id,
    mediaUrl,
    status: row.status,
    keywords: row.keywords ?? [],
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// GET /api/v1/social/[id]
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const auth = await requireApiAuth()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('social_posts' as never)
      .select(
        'id, platform, post_type, title, body, hashtags, cta_type, cta_url, media_asset_id, status, keywords, metadata, published_at, created_at, updated_at',
      )
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .returns<SocialPostRow[]>()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Social post not found' }, { status: 404 })
    }

    // Fetch media URL if attached
    let mediaUrl: string | null = null
    if (data.media_asset_id) {
      const { data: media } = await supabase
        .from('media_assets')
        .select('storage_path')
        .eq('id', data.media_asset_id)
        .returns<{ storage_path: string }[]>()
        .single()

      if (media) {
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(media.storage_path)
        mediaUrl = urlData.publicUrl
      }
    }

    return NextResponse.json(rowToDetail(data, mediaUrl))
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Social Detail Error]', err)
    return NextResponse.json({ error: 'Failed to fetch social post' }, { status: 500 })
  }
}

// PUT /api/v1/social/[id]
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const auth = await requireApiRole('editor')
    const supabase = await createClient()

    const body = await request.json()
    const parseResult = socialPostEditSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const input = parseResult.data

    // Fetch current status
    const { data: current, error: fetchError } = await supabase
      .from('social_posts' as never)
      .select('id, status')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .returns<{ id: string; status: ContentStatus }[]>()
      .single()

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Social post not found' }, { status: 404 })
    }

    if (!EDITABLE_STATUSES.includes(current.status)) {
      return NextResponse.json(
        { error: `Cannot edit post with status "${current.status}".` },
        { status: 422 },
      )
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {}
    if (input.title !== undefined) updatePayload.title = input.title
    if (input.body !== undefined) updatePayload.body = input.body
    if (input.hashtags !== undefined) updatePayload.hashtags = input.hashtags
    if (input.ctaType !== undefined) updatePayload.cta_type = input.ctaType
    if (input.ctaUrl !== undefined) updatePayload.cta_url = input.ctaUrl

    const { error: updateError } = await supabase
      .from('social_posts' as never)
      .update(updatePayload as never)
      .eq('id', id)
      .eq('organization_id', auth.organizationId)

    if (updateError) throw updateError

    // Refetch and return
    const { data: updated, error: refetchError } = await supabase
      .from('social_posts' as never)
      .select(
        'id, platform, post_type, title, body, hashtags, cta_type, cta_url, media_asset_id, status, keywords, metadata, published_at, created_at, updated_at',
      )
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .returns<SocialPostRow[]>()
      .single()

    if (refetchError || !updated) throw refetchError ?? new Error('Failed to refetch')

    return NextResponse.json(rowToDetail(updated, null))
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Social Edit Error]', err)
    return NextResponse.json({ error: 'Failed to update social post' }, { status: 500 })
  }
}
