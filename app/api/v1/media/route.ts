import { NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import type { MediaLibraryItem, ImageType } from '@/types/media'

const VALID_IMAGE_TYPES: ImageType[] = ['blog_thumbnail', 'location_hero', 'social_graphic']

export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth()
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const imageTypeFilter = searchParams.get('imageType')

    let query = supabase
      .from('media_assets')
      .select(
        'id, filename, storage_path, mime_type, size_bytes, width, height, alt_text, metadata, created_at',
      )
      .eq('organization_id', auth.organizationId)
      .eq('type', 'image')
      .order('created_at', { ascending: false })

    if (imageTypeFilter && VALID_IMAGE_TYPES.includes(imageTypeFilter as ImageType)) {
      query = query.eq('metadata->>imageType', imageTypeFilter)
    }

    const { data, error } = await query

    if (error) throw error

    const { data: bucketUrl } = supabase.storage.from('media').getPublicUrl('')

    const items: MediaLibraryItem[] = (data ?? []).map((row) => {
      const metadata = row.metadata as Record<string, unknown> | null
      return {
        id: row.id,
        imageType: (metadata?.imageType as ImageType) ?? null,
        filename: row.filename,
        publicUrl: `${bucketUrl.publicUrl}${row.storage_path}`,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
        width: row.width,
        height: row.height,
        altText: row.alt_text,
        createdAt: row.created_at,
      }
    })

    return NextResponse.json({ items })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Media List Error]', err)
    return NextResponse.json({ error: 'Failed to load media library' }, { status: 500 })
  }
}
