import { Worker, type Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { getRedisConnection } from './connection'
import type { PublishJobData } from './scheduler'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function getTableName(contentType: string): string {
  switch (contentType) {
    case 'service_page':
      return 'service_pages'
    case 'location_page':
      return 'location_pages'
    case 'blog_post':
      return 'blog_posts'
    default:
      throw new Error(`Unknown content type: ${contentType}`)
  }
}

async function processPublishJob(job: Job<PublishJobData>): Promise<void> {
  const { calendarEntryId, contentType, contentId } = job.data
  const supabase = getAdminClient()

  // Verify calendar entry is still scheduled
  const { data: entry, error: fetchError } = await supabase
    .from('content_calendar')
    .select('id, status')
    .eq('id', calendarEntryId)
    .single()

  if (fetchError || !entry) {
    throw new Error(`Calendar entry ${calendarEntryId} not found`)
  }

  if (entry.status !== 'scheduled') {
    return // Already processed or cancelled
  }

  // Mark as publishing
  await supabase
    .from('content_calendar')
    .update({ status: 'publishing' })
    .eq('id', calendarEntryId)

  // Publish the content
  const table = getTableName(contentType)
  const { error: publishError } = await supabase
    .from(table)
    .update({ status: 'published', published_at: new Date().toISOString() } as never)
    .eq('id', contentId)

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

export function createPublishWorker(): Worker<PublishJobData> {
  return new Worker<PublishJobData>('content-publish', processPublishJob, {
    connection: getRedisConnection(),
    concurrency: 5,
  })
}
