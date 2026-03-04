import { generateImage } from './gemini'
import { uploadImage } from '@/lib/storage/supabase-storage'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildBlogThumbnailPrompt,
  buildLocationHeroPrompt,
  buildSocialGraphicPrompt,
} from '@/packages/ai/prompts/images'
import type { OrgContext } from '@/packages/ai/prompts/content/shared'
import type { GenerateImageRequest, GenerateImageResponse } from '@/types/media'
import type { Json } from '@/types'

export async function generateAndStoreImage(
  input: GenerateImageRequest,
  orgContext: OrgContext,
  orgId: string,
  userId: string,
): Promise<GenerateImageResponse> {
  // 1. Build prompt based on image type
  const prompt = buildImagePrompt(input, orgContext)

  // 2. Call Gemini to generate image
  const result = await generateImage({ prompt })

  // 3. Upload to Supabase Storage
  const upload = await uploadImage(orgId, input.imageType, result.imageData, result.mimeType)

  // 4. Build alt text and filename
  const altText = buildAltText(input, orgContext)
  const filename = buildFilename(input)

  // 5. Insert media_assets record
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('media_assets')
    .insert({
      organization_id: orgId,
      type: 'image' as const,
      filename,
      storage_path: upload.storagePath,
      storage_provider: 'supabase',
      mime_type: result.mimeType,
      size_bytes: upload.sizeBytes,
      alt_text: altText,
      metadata: { imageType: input.imageType, promptUsed: prompt } as unknown as Json,
      created_by: userId,
    } as never)
    .select('id, width, height')
    .single()

  if (error) throw error

  return {
    id: data!.id as string,
    imageType: input.imageType,
    filename,
    storagePath: upload.storagePath,
    publicUrl: upload.publicUrl,
    mimeType: result.mimeType,
    sizeBytes: upload.sizeBytes,
    width: (data!.width as number) ?? null,
    height: (data!.height as number) ?? null,
    altText,
  }
}

function buildImagePrompt(input: GenerateImageRequest, org: OrgContext): string {
  switch (input.imageType) {
    case 'blog_thumbnail':
      return buildBlogThumbnailPrompt(input, org)
    case 'location_hero':
      return buildLocationHeroPrompt(input, org)
    case 'social_graphic':
      return buildSocialGraphicPrompt(input, org)
  }
}

function buildAltText(input: GenerateImageRequest, org: OrgContext): string {
  switch (input.imageType) {
    case 'blog_thumbnail':
      return `Blog thumbnail for "${input.topic}" — ${org.orgName}`
    case 'location_hero':
      return `${input.serviceName} in ${input.city}, ${input.state} — ${org.orgName}`
    case 'social_graphic':
      return `Social graphic: ${input.message.slice(0, 80)} — ${org.orgName}`
  }
}

function buildFilename(input: GenerateImageRequest): string {
  const slug = (text: string) =>
    text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 50)

  switch (input.imageType) {
    case 'blog_thumbnail':
      return `blog-${slug(input.topic)}.png`
    case 'location_hero':
      return `hero-${slug(input.city)}-${input.state.toLowerCase()}.png`
    case 'social_graphic':
      return `social-${slug(input.message)}.png`
  }
}
