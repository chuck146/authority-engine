import { NextResponse } from 'next/server'
import { requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { isUserRateLimited } from '@/lib/leads/auth-rate-limiter'
import { uploadImage } from '@/lib/storage/supabase-storage'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/types'

export const maxDuration = 30

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
])

// Magic byte signatures for image formats
const MAGIC_BYTES: [string, number[]][] = [
  ['image/jpeg', [0xff, 0xd8, 0xff]],
  ['image/png', [0x89, 0x50, 0x4e, 0x47]],
  ['image/gif', [0x47, 0x49, 0x46]],
  ['image/webp', [0x52, 0x49, 0x46, 0x46]], // RIFF header
]

function validateMagicBytes(buffer: Buffer, claimedType: string): boolean {
  // SVGs are text-based, skip magic byte check
  if (claimedType === 'image/svg+xml') return true
  const match = MAGIC_BYTES.find(([mime]) => mime === claimedType)
  if (!match) return false
  const [, expected] = match
  return expected.every((byte, i) => buffer[i] === byte)
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiRole('editor')

    if (isUserRateLimited(auth.userId, 'media-upload', { max: 50 })) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const imageType = formData.get('imageType') as string | null

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'File must be a JPEG, PNG, WebP, GIF, or SVG image' },
        { status: 400 },
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File must be under 10 MB' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: 'File content does not match declared type' },
        { status: 400 },
      )
    }
    const storageType = imageType || 'upload'
    const upload = await uploadImage(auth.organizationId, storageType, buffer, file.type)

    const filename =
      file.name || `upload-${crypto.randomUUID()}.${file.type.split('/')[1] ?? 'png'}`

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('media_assets')
      .insert({
        organization_id: auth.organizationId,
        type: 'image' as const,
        filename,
        storage_path: upload.storagePath,
        storage_provider: 'supabase',
        mime_type: file.type,
        size_bytes: upload.sizeBytes,
        alt_text: filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
        metadata: { imageType: imageType || 'upload', source: 'user_upload' } as unknown as Json,
        created_by: auth.userId,
      } as never)
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json(
      {
        id: data!.id as string,
        publicUrl: upload.publicUrl,
        filename,
        mimeType: file.type,
        sizeBytes: upload.sizeBytes,
      },
      { status: 201 },
    )
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Image Upload Error]', err)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}
