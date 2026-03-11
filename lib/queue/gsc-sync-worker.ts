import { Worker } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { getRedisConnection } from './connection'
import { getValidToken } from '@/lib/google/token-manager'
import { fetchSearchAnalytics, fetchSitemaps } from '@/lib/google/search-console'
import type { Database } from '@/types/database'

export type GscSyncJobData = {
  organizationId: string
}

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]!
}

function getDateRange() {
  const endDate = new Date()
  endDate.setDate(endDate.getDate() - 1) // yesterday — GSC data has ~2 day lag
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - 27) // 28-day window
  return { startDate: formatDate(startDate), endDate: formatDate(endDate) }
}

/**
 * Core GSC sync logic — callable from BullMQ worker, API routes, or Vercel cron.
 */
export async function syncGscForOrg(organizationId: string): Promise<void> {
  const supabase = getAdminClient()

  let accessToken: string
  let siteUrl: string
  try {
    const token = await getValidToken(organizationId)
    accessToken = token.accessToken
    siteUrl = token.siteUrl
  } catch {
    // No active GSC connection — skip silently
    return
  }

  if (!siteUrl) {
    throw new Error(
      'No verified site URL found for this GSC connection. Disconnect and reconnect Google Search Console in Settings to select a verified property.',
    )
  }

  const { startDate, endDate } = getDateRange()
  const today = formatDate(new Date())

  // Fetch search analytics (query + page dimensions for keyword rankings)
  const analyticsResult = await fetchSearchAnalytics({
    accessToken,
    siteUrl,
    startDate,
    endDate,
    dimensions: ['query', 'page', 'date'],
    rowLimit: 25000,
  })

  const rows = analyticsResult.rows ?? []

  // Upsert keyword rankings
  if (rows.length > 0) {
    const BATCH_SIZE = 500
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE).map((r) => ({
        organization_id: organizationId,
        query: r.keys[0]!,
        page: r.keys[1]!,
        date: r.keys[2]!,
        device: 'ALL',
        country: 'ALL',
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      }))

      await supabase.from('keyword_rankings').upsert(batch as never, {
        onConflict: 'organization_id,query,page,date,device',
        ignoreDuplicates: false,
      })
    }
  }

  // Fetch and store sitemap snapshot
  const rawSitemaps = await fetchSitemaps({ accessToken, siteUrl })
  const sitemapData = rawSitemaps.map((s) => ({
    path: s.path,
    isPending: s.isPending,
    lastDownloaded: s.lastDownloaded ?? null,
    warnings: parseInt(s.warnings) || 0,
    errors: parseInt(s.errors) || 0,
    contents: (s.contents ?? []).map((c) => ({
      type: c.type,
      submitted: parseInt(c.submitted) || 0,
      indexed: parseInt(c.indexed) || 0,
    })),
  }))

  await supabase.from('gsc_snapshots').upsert(
    {
      organization_id: organizationId,
      snapshot_type: 'sitemaps',
      snapshot_date: today,
      data: sitemapData as unknown as Database['public']['Tables']['gsc_snapshots']['Insert']['data'],
    } as never,
    { onConflict: 'organization_id,snapshot_type,snapshot_date', ignoreDuplicates: false },
  )

  // Update last synced timestamp on the connection
  await supabase
    .from('google_connections')
    .update({ updated_at: new Date().toISOString() } as never)
    .eq('organization_id', organizationId)
    .eq('provider', 'search_console')
}

export function createGscSyncWorker(): Worker<GscSyncJobData> {
  return new Worker<GscSyncJobData>(
    'gsc-sync',
    async (job) => syncGscForOrg(job.data.organizationId),
    {
      connection: getRedisConnection(),
      concurrency: 2,
    },
  )
}
