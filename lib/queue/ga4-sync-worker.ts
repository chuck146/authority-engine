import { Worker, type Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { getRedisConnection } from './connection'
import { getValidToken } from '@/lib/google/token-manager'
import { runReport } from '@/lib/google/analytics'
import type { Database } from '@/types/database'

export type Ga4SyncJobData = {
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
  endDate.setDate(endDate.getDate() - 1) // yesterday — GA4 data has ~1 day lag
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - 27) // 28-day window
  return { startDate: formatDate(startDate), endDate: formatDate(endDate) }
}

export async function processGa4SyncJob(job: Job<Ga4SyncJobData>): Promise<void> {
  const { organizationId } = job.data
  const supabase = getAdminClient()

  let accessToken: string
  let propertyId: string
  try {
    const token = await getValidToken(organizationId, 'analytics')
    accessToken = token.accessToken
    propertyId = token.siteUrl // site_url stores GA4 property ID
  } catch {
    // No active GA4 connection — skip silently
    return
  }

  if (!propertyId) return

  const { startDate, endDate } = getDateRange()
  const today = formatDate(new Date())
  const dateRanges = [{ startDate, endDate }]

  // Fetch page metrics
  const pageReport = await runReport({
    accessToken,
    propertyId,
    request: {
      dateRanges,
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }, { name: 'date' }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'engagementRate' },
      ],
      limit: 25000,
    },
  })

  const pageRows = pageReport.rows ?? []

  // Upsert page metrics in batches
  if (pageRows.length > 0) {
    const BATCH_SIZE = 500
    for (let i = 0; i < pageRows.length; i += BATCH_SIZE) {
      const batch = pageRows.slice(i, i + BATCH_SIZE).map((r) => ({
        organization_id: organizationId,
        page_path: r.dimensionValues?.[0]?.value ?? '',
        page_title: r.dimensionValues?.[1]?.value ?? '',
        date: r.dimensionValues?.[2]?.value ?? today,
        sessions: parseInt(r.metricValues?.[0]?.value ?? '0') || 0,
        users: parseInt(r.metricValues?.[1]?.value ?? '0') || 0,
        pageviews: parseInt(r.metricValues?.[2]?.value ?? '0') || 0,
        bounce_rate: parseFloat(r.metricValues?.[3]?.value ?? '0') || 0,
        avg_session_duration: parseFloat(r.metricValues?.[4]?.value ?? '0') || 0,
        engagement_rate: parseFloat(r.metricValues?.[5]?.value ?? '0') || 0,
      }))

      await supabase.from('ga4_page_metrics').upsert(batch as never, {
        onConflict: 'organization_id,page_path,date',
        ignoreDuplicates: false,
      })
    }
  }

  // Fetch traffic sources
  const sourcesReport = await runReport({
    accessToken,
    propertyId,
    request: {
      dateRanges,
      dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'bounceRate' }],
      limit: 100,
    },
  })

  const sourcesData = (sourcesReport.rows ?? []).map((r) => ({
    source: r.dimensionValues?.[0]?.value ?? '(direct)',
    medium: r.dimensionValues?.[1]?.value ?? '(none)',
    sessions: parseInt(r.metricValues?.[0]?.value ?? '0') || 0,
    users: parseInt(r.metricValues?.[1]?.value ?? '0') || 0,
    bounceRate: parseFloat(r.metricValues?.[2]?.value ?? '0') || 0,
  }))

  await supabase.from('ga4_snapshots').upsert(
    {
      organization_id: organizationId,
      snapshot_type: 'traffic_sources',
      snapshot_date: today,
      data: sourcesData as unknown as Database['public']['Tables']['ga4_snapshots']['Insert']['data'],
    } as never,
    { onConflict: 'organization_id,snapshot_type,snapshot_date', ignoreDuplicates: false },
  )

  // Fetch device breakdown
  const deviceReport = await runReport({
    accessToken,
    propertyId,
    request: {
      dateRanges,
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
    },
  })

  const deviceData = (deviceReport.rows ?? []).map((r) => ({
    deviceCategory: r.dimensionValues?.[0]?.value ?? 'unknown',
    sessions: parseInt(r.metricValues?.[0]?.value ?? '0') || 0,
    users: parseInt(r.metricValues?.[1]?.value ?? '0') || 0,
  }))

  await supabase.from('ga4_snapshots').upsert(
    {
      organization_id: organizationId,
      snapshot_type: 'device_breakdown',
      snapshot_date: today,
      data: deviceData as unknown as Database['public']['Tables']['ga4_snapshots']['Insert']['data'],
    } as never,
    { onConflict: 'organization_id,snapshot_type,snapshot_date', ignoreDuplicates: false },
  )

  // Update last synced timestamp on the connection
  await supabase
    .from('google_connections')
    .update({ updated_at: new Date().toISOString() } as never)
    .eq('organization_id', organizationId)
    .eq('provider', 'analytics')
}

export function createGa4SyncWorker(): Worker<Ga4SyncJobData> {
  return new Worker<Ga4SyncJobData>('ga4-sync', processGa4SyncJob, {
    connection: getRedisConnection(),
    concurrency: 2,
  })
}
