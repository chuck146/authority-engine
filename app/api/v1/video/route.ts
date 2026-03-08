import { NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import type { VideoType, VideoEngine, VideoLibraryItem } from '@/types/video'
import { videoTypeSchema, videoEngineSchema } from '@/types/video'

export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth()
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const videoTypeFilter = searchParams.get('videoType')
    const engineFilter = searchParams.get('engine')

    let query = supabase
      .from('media_assets')
      .select(
        'id, filename, storage_path, mime_type, size_bytes, duration_seconds, metadata, created_at',
      )
      .eq('organization_id', auth.organizationId)
      .eq('type', 'video')
      .order('created_at', { ascending: false })

    if (videoTypeFilter && videoTypeSchema.safeParse(videoTypeFilter).success) {
      query = query.eq('metadata->>videoType', videoTypeFilter)
    }

    if (engineFilter && videoEngineSchema.safeParse(engineFilter).success) {
      query = query.eq('metadata->>engine', engineFilter)
    }

    const { data, error } = await query

    if (error) throw error

    const { data: bucketUrl } = supabase.storage.from('media').getPublicUrl('')

    const items: VideoLibraryItem[] = (data ?? []).map((row) => {
      const metadata = row.metadata as Record<string, unknown> | null
      return {
        id: row.id,
        videoType: (metadata?.videoType as VideoType) ?? null,
        engine: (metadata?.engine as VideoEngine) ?? null,
        filename: row.filename,
        publicUrl: `${bucketUrl.publicUrl}${row.storage_path}`,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
        durationSeconds: row.duration_seconds,
        createdAt: row.created_at,
      }
    })

    return NextResponse.json({ items })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Video List Error]', err)
    return NextResponse.json({ error: 'Failed to load video library' }, { status: 500 })
  }
}
