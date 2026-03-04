import { NextResponse } from 'next/server'
import { requireApiAuth, requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ImageType } from '@/types/media'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireApiAuth()
    const { id } = await context.params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('media_assets')
      .select('*')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Media asset not found' }, { status: 404 })
    }

    const metadata = data.metadata as Record<string, unknown> | null
    const { data: bucketUrl } = supabase.storage.from('media').getPublicUrl('')

    return NextResponse.json({
      id: data.id,
      imageType: (metadata?.imageType as ImageType) ?? null,
      filename: data.filename,
      storagePath: data.storage_path,
      publicUrl: `${bucketUrl.publicUrl}${data.storage_path}`,
      mimeType: data.mime_type,
      sizeBytes: data.size_bytes,
      width: data.width,
      height: data.height,
      altText: data.alt_text,
      metadata,
      createdAt: data.created_at,
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Media Detail Error]', err)
    return NextResponse.json({ error: 'Failed to load media asset' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireApiRole('editor')
    const { id } = await context.params
    const supabase = await createClient()

    // Get the asset first to find the storage path
    const { data: asset } = await supabase
      .from('media_assets')
      .select('storage_path')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .single()

    if (!asset) {
      return NextResponse.json({ error: 'Media asset not found' }, { status: 404 })
    }

    // Delete from storage (use admin client to bypass RLS)
    const admin = createAdminClient()
    await admin.storage.from('media').remove([asset.storage_path])

    // Delete the DB record
    const { error } = await admin
      .from('media_assets')
      .delete()
      .eq('id', id)
      .eq('organization_id', auth.organizationId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Media Delete Error]', err)
    return NextResponse.json({ error: 'Failed to delete media asset' }, { status: 500 })
  }
}
