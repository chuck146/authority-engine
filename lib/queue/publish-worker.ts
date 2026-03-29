import { Worker, type Job } from 'bullmq'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getRedisConnection } from './connection'
import type { PublishJobData } from './scheduler'
import type { Database } from '@/types/database'
import { publishSocialPostToGbp } from '@/lib/google/gbp-publisher'

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

type ContentTableName =
  | 'service_pages'
  | 'location_pages'
  | 'blog_posts'
  | 'social_posts'
  | 'media_assets'

function getTableName(contentType: string): ContentTableName {
  switch (contentType) {
    case 'service_page':
      return 'service_pages'
    case 'location_page':
      return 'location_pages'
    case 'blog_post':
      return 'blog_posts'
    case 'social_post':
      return 'social_posts'
    case 'video':
      return 'media_assets'
    default:
      throw new Error(`Unknown content type: ${contentType}`)
  }
}

type CalendarEntryForPublish = {
  id: string
  content_type: string
  content_id: string
}

export async function publishCalendarEntry(
  supabase: SupabaseClient<Database>,
  entry: CalendarEntryForPublish,
): Promise<void> {
  const { id: calendarEntryId, content_type: contentType, content_id: contentId } = entry

  // Verify calendar entry is still scheduled
  const { data: calendarEntry, error: fetchError } = await supabase
    .from('content_calendar')
    .select('id, status')
    .eq('id', calendarEntryId)
    .single()

  if (fetchError || !calendarEntry) {
    throw new Error(`Calendar entry ${calendarEntryId} not found`)
  }

  if (calendarEntry.status !== 'scheduled') {
    return // Already processed or cancelled
  }

  // Mark as publishing
  await supabase.from('content_calendar').update({ status: 'publishing' }).eq('id', calendarEntryId)

  // Publish the content
  const table = getTableName(contentType)
  let publishError: { message: string } | null = null

  if (contentType === 'video') {
    // Videos use metadata JSONB — no status column on media_assets
    const { data: asset } = await supabase
      .from('media_assets')
      .select('metadata')
      .eq('id', contentId)
      .single()

    const existingMetadata = (asset?.metadata as Record<string, unknown>) ?? {}
    const { error } = await supabase
      .from('media_assets')
      .update({
        metadata: {
          ...existingMetadata,
          published: true,
          published_at: new Date().toISOString(),
        },
      } as never)
      .eq('id', contentId)

    publishError = error
  } else {
    // For GBP social posts, publish to Google Business Profile first
    if (contentType === 'social_post') {
      const { data: socialPost } = await supabase
        .from('social_posts')
        .select('platform, organization_id')
        .eq('id', contentId)
        .single()

      if (socialPost?.platform === 'gbp') {
        const gbpResult = await publishSocialPostToGbp(
          supabase,
          contentId,
          socialPost.organization_id,
        )
        if (gbpResult.error) {
          await supabase
            .from('content_calendar')
            .update({ status: 'failed', error_message: `GBP publish failed: ${gbpResult.error}` })
            .eq('id', calendarEntryId)
          throw new Error(`GBP publish failed: ${gbpResult.error}`)
        }
        // gbpResult.published === false without error means no connection — proceed with internal publish
      }
    }

    const { error } = await supabase
      .from(table as never)
      .update({ status: 'published', published_at: new Date().toISOString() } as never)
      .eq('id', contentId)

    publishError = error
  }

  if (publishError) {
    await supabase
      .from('content_calendar')
      .update({ status: 'failed', error_message: publishError.message })
      .eq('id', calendarEntryId)
    throw publishError
  }

  // Mark calendar entry as published
  await supabase
    .from('content_calendar')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', calendarEntryId)
}

async function processPublishJob(job: Job<PublishJobData>): Promise<void> {
  const supabase = getAdminClient()
  await publishCalendarEntry(supabase, {
    id: job.data.calendarEntryId,
    content_type: job.data.contentType,
    content_id: job.data.contentId,
  })
}

export async function publishScheduledContent(): Promise<{
  published: number
  failed: number
}> {
  const supabase = getAdminClient()

  const { data: entries } = await supabase
    .from('content_calendar')
    .select('id, content_type, content_id')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })

  if (!entries || entries.length === 0) {
    return { published: 0, failed: 0 }
  }

  let published = 0
  let failed = 0

  for (const entry of entries) {
    try {
      await publishCalendarEntry(supabase, entry)
      published++
    } catch (err) {
      failed++
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[Publish Cron] Failed for entry ${entry.id} (${entry.content_type}):`, message)
    }
  }

  return { published, failed }
}

export function createPublishWorker(): Worker<PublishJobData> {
  return new Worker<PublishJobData>('content-publish', processPublishJob, {
    connection: getRedisConnection(),
    concurrency: 5,
  })
}
