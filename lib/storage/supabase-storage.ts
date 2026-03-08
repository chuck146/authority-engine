import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'media'

export type UploadResult = {
  storagePath: string
  publicUrl: string
  sizeBytes: number
}

export async function uploadImage(
  orgId: string,
  imageType: string,
  buffer: Buffer,
  mimeType: string,
): Promise<UploadResult> {
  const admin = createAdminClient()
  const ext = mimeType.split('/')[1] ?? 'png'
  const filename = `${crypto.randomUUID()}.${ext}`
  const storagePath = `${orgId}/images/${imageType}/${filename}`

  const { error } = await admin.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: mimeType,
    upsert: false,
  })

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`)
  }

  const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(storagePath)

  return {
    storagePath,
    publicUrl: urlData.publicUrl,
    sizeBytes: buffer.byteLength,
  }
}

export async function uploadVideo(
  orgId: string,
  videoType: string,
  buffer: Buffer,
  mimeType: string,
): Promise<UploadResult> {
  const admin = createAdminClient()
  const ext = mimeType.split('/')[1] ?? 'mp4'
  const filename = `${crypto.randomUUID()}.${ext}`
  const storagePath = `${orgId}/videos/${videoType}/${filename}`

  const { error } = await admin.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: mimeType,
    upsert: false,
  })

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`)
  }

  const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(storagePath)

  return {
    storagePath,
    publicUrl: urlData.publicUrl,
    sizeBytes: buffer.byteLength,
  }
}
