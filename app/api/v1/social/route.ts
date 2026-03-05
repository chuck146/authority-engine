import { NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import type { SocialPostListItem, SocialPlatform } from '@/types/social'

type SocialPostRow = {
  id: string
  platform: string
  post_type: string
  title: string | null
  body: string
  hashtags: string[]
  status: string
  media_asset_id: string | null
  created_at: string
}

// GET /api/v1/social?platform=gbp&status=review
export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth()
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')
    const status = searchParams.get('status')

    let query = supabase
      .from('social_posts' as never)
      .select('id, platform, post_type, title, body, hashtags, status, media_asset_id, created_at')
      .eq('organization_id', auth.organizationId)
      .order('created_at', { ascending: false })

    if (platform) {
      query = query.eq('platform', platform)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query.returns<SocialPostRow[]>()

    if (error) throw error

    const items: SocialPostListItem[] = (data ?? []).map((row) => ({
      id: row.id,
      platform: row.platform as SocialPlatform,
      postType: row.post_type,
      title: row.title,
      body: row.body,
      hashtags: row.hashtags ?? [],
      status: row.status,
      mediaAssetId: row.media_asset_id,
      createdAt: row.created_at,
    }))

    return NextResponse.json(items)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Social List Error]', err)
    return NextResponse.json({ error: 'Failed to load social posts' }, { status: 500 })
  }
}
