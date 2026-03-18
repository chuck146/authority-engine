import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { GbpLocalPostRequest } from '@/types/gbp'
import { postTypeToTopicType } from '@/types/gbp'
import { getValidToken } from './token-manager'
import { createLocalPost } from './business-profile'

/** GBP post body limit */
const GBP_SUMMARY_MAX_LENGTH = 1500

type PublishResult = {
  published: boolean
  gbpPostName?: string
  error?: string
}

/**
 * Publish a social post to Google Business Profile.
 * Returns { published: false } gracefully if no GBP connection exists.
 */
export async function publishSocialPostToGbp(
  supabase: SupabaseClient<Database>,
  socialPostId: string,
  organizationId: string,
): Promise<PublishResult> {
  // Fetch social post
  const { data: post, error: postError } = await supabase
    .from('social_posts')
    .select('body, post_type, cta_type, cta_url, media_asset_id, metadata')
    .eq('id', socialPostId)
    .single()

  if (postError || !post) {
    return { published: false, error: `Social post ${socialPostId} not found` }
  }

  // Get GBP token — if no connection, skip gracefully
  let accessToken: string
  let locationName: string
  try {
    const token = await getValidToken(organizationId, 'business_profile')
    accessToken = token.accessToken
    locationName = token.siteUrl // site_url stores GBP location name
  } catch {
    // No active GBP connection — publish internally only
    return { published: false }
  }

  if (!locationName) {
    return { published: false, error: 'No GBP location selected' }
  }

  // Resolve media URL if image attached
  let imageUrl: string | null = null
  if (post.media_asset_id) {
    const { data: media } = await supabase
      .from('media_assets')
      .select('storage_path')
      .eq('id', post.media_asset_id)
      .returns<{ storage_path: string }[]>()
      .single()

    if (media) {
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(media.storage_path)
      imageUrl = urlData.publicUrl
    }
  }

  // Build GBP Local Post request
  const gbpPost: GbpLocalPostRequest = {
    languageCode: 'en',
    summary: post.body.slice(0, GBP_SUMMARY_MAX_LENGTH),
    topicType: postTypeToTopicType(post.post_type),
  }

  if (post.cta_type && post.cta_url) {
    gbpPost.callToAction = {
      actionType: post.cta_type,
      url: post.cta_url,
    }
  }

  if (imageUrl) {
    gbpPost.media = [{ mediaFormat: 'PHOTO', sourceUrl: imageUrl }]
  }

  // Post to GBP
  try {
    const result = await createLocalPost({ accessToken, locationName, post: gbpPost })

    // Store GBP metadata on social post
    const existingMetadata = (post.metadata as Record<string, unknown>) ?? {}
    await supabase
      .from('social_posts')
      .update({
        metadata: {
          ...existingMetadata,
          gbp_post_name: result.name,
          gbp_published_at: new Date().toISOString(),
        },
      } as never)
      .eq('id', socialPostId)

    return { published: true, gbpPostName: result.name }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown GBP API error'
    return { published: false, error: message }
  }
}
