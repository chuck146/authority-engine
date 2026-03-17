/**
 * Staggered Content Publishing Schedule
 *
 * Approves review-status content and schedules it across 5 weeks using the
 * content calendar. Location pages first (high-intent SEO wins), then blog
 * posts. Social posts interleave on alternate days to promote new content.
 *
 * Schedule pattern:
 *   Tue/Thu → content pages (location, then blog)
 *   Mon/Wed/Fri → social posts
 *   All at 9:00 AM ET (14:00 UTC)
 *
 * Usage:
 *   npx tsx scripts/schedule-publishing.ts --dry-run
 *   npx tsx scripts/schedule-publishing.ts
 *   npx tsx scripts/schedule-publishing.ts --start-date=2026-03-17
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ORG_ID = '00000000-0000-0000-0000-000000000001'
const PUBLISH_HOUR_UTC = 14 // 9:00 AM ET = 14:00 UTC

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const flagMap = new Map<string, string>()
for (const arg of args) {
  const m = arg.match(/^--(\w[\w-]*)(?:=(.*))?$/)
  if (m?.[1]) flagMap.set(m[1], m[2] ?? 'true')
}
const dryRun = flagMap.has('dry-run')
const startDateStr = flagMap.get('start-date')

// ---------------------------------------------------------------------------
// Supabase client
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ScheduleItem = {
  id: string
  title: string
  table: string
  contentType: 'location_page' | 'blog_post' | 'social_post'
  platform?: string
  scheduledAt: string
}

// ---------------------------------------------------------------------------
// Lookup org user for created_by
// ---------------------------------------------------------------------------

async function getOrgUserId(): Promise<string> {
  const { data, error } = await supabase
    .from('user_organizations')
    .select('user_id')
    .eq('organization_id', ORG_ID)
    .limit(1)
    .single()
  if (error || !data) throw new Error(`No user found for org ${ORG_ID}: ${error?.message}`)
  return data.user_id
}

// ---------------------------------------------------------------------------
// Fetch review-status content
// ---------------------------------------------------------------------------

async function fetchReviewContent() {
  const [locations, blogs, social] = await Promise.all([
    supabase
      .from('location_pages')
      .select('id, title, slug')
      .eq('organization_id', ORG_ID)
      .eq('status', 'review' as never)
      .order('created_at', { ascending: true })
      .returns<{ id: string; title: string; slug: string }[]>(),
    supabase
      .from('blog_posts')
      .select('id, title, slug')
      .eq('organization_id', ORG_ID)
      .eq('status', 'review' as never)
      .order('created_at', { ascending: true })
      .returns<{ id: string; title: string; slug: string }[]>(),
    supabase
      .from('social_posts')
      .select('id, title, body, platform')
      .eq('organization_id', ORG_ID)
      .eq('status', 'review' as never)
      .order('created_at', { ascending: true })
      .returns<{ id: string; title: string | null; body: string; platform: string }[]>(),
  ])

  return {
    locations: locations.data ?? [],
    blogs: blogs.data ?? [],
    social: social.data ?? [],
  }
}

// ---------------------------------------------------------------------------
// Build schedule
// ---------------------------------------------------------------------------

function buildSchedule(
  locations: { id: string; title: string }[],
  blogs: { id: string; title: string }[],
  social: { id: string; title: string | null; body: string; platform: string }[],
  startDate: Date,
): ScheduleItem[] {
  const schedule: ScheduleItem[] = []

  // Content pages go on Tue (2) and Thu (4)
  const contentItems: {
    id: string
    title: string
    table: string
    contentType: 'location_page' | 'blog_post'
  }[] = [
    ...locations.map((l) => ({
      id: l.id,
      title: l.title,
      table: 'location_pages',
      contentType: 'location_page' as const,
    })),
    ...blogs.map((b) => ({
      id: b.id,
      title: b.title,
      table: 'blog_posts',
      contentType: 'blog_post' as const,
    })),
  ]

  // Social posts go on Mon (1), Wed (3), Fri (5)
  const socialItems = social.map((s) => ({
    id: s.id,
    title: s.title || s.body.slice(0, 60) + '...',
    table: 'social_posts',
    contentType: 'social_post' as const,
    platform: s.platform,
  }))

  // Walk calendar days starting from startDate
  const contentSlotDays = [2, 4] // Tue, Thu
  const socialSlotDays = [1, 3, 5] // Mon, Wed, Fri

  let contentIdx = 0
  let socialIdx = 0
  const current = new Date(startDate)

  // Walk up to 8 weeks to fill all slots
  const maxDays = 56
  for (let d = 0; d < maxDays; d++) {
    if (contentIdx >= contentItems.length && socialIdx >= socialItems.length) break

    const dayOfWeek = current.getUTCDay() // 0=Sun, 1=Mon, ...

    if (contentSlotDays.includes(dayOfWeek) && contentIdx < contentItems.length) {
      const item = contentItems[contentIdx]!
      const scheduledAt = new Date(current)
      scheduledAt.setUTCHours(PUBLISH_HOUR_UTC, 0, 0, 0)
      schedule.push({
        ...item,
        scheduledAt: scheduledAt.toISOString(),
      })
      contentIdx++
    }

    if (socialSlotDays.includes(dayOfWeek) && socialIdx < socialItems.length) {
      const item = socialItems[socialIdx]!
      const scheduledAt = new Date(current)
      scheduledAt.setUTCHours(PUBLISH_HOUR_UTC, 0, 0, 0)
      schedule.push({
        ...item,
        scheduledAt: scheduledAt.toISOString(),
      })
      socialIdx++
    }

    current.setUTCDate(current.getUTCDate() + 1)
  }

  return schedule.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
}

// ---------------------------------------------------------------------------
// Print schedule preview
// ---------------------------------------------------------------------------

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function printSchedule(schedule: ScheduleItem[]) {
  console.log('\n  ' + 'Date'.padEnd(14) + 'Day'.padEnd(6) + 'Type'.padEnd(16) + 'Title')
  console.log('  ' + '-'.repeat(72))

  for (const item of schedule) {
    const date = new Date(item.scheduledAt)
    const dateStr = item.scheduledAt.slice(0, 10)
    const day = DAY_NAMES[date.getUTCDay()] ?? '?'
    const typeLabel =
      item.contentType === 'social_post'
        ? `Social (${item.platform ?? '?'})`
        : item.contentType === 'location_page'
          ? 'Location'
          : 'Blog'
    console.log(
      '  ' + dateStr.padEnd(14) + day.padEnd(6) + typeLabel.padEnd(16) + item.title.slice(0, 45),
    )
  }
}

// ---------------------------------------------------------------------------
// Execute schedule
// ---------------------------------------------------------------------------

async function executeSchedule(
  schedule: ScheduleItem[],
  userId: string,
): Promise<{ approved: number; scheduled: number; errors: string[] }> {
  let approved = 0
  let scheduled = 0
  const errors: string[] = []

  for (const item of schedule) {
    const dateStr = item.scheduledAt.slice(0, 10)
    const label = item.title.slice(0, 40)

    // Step 1: Approve content (review → approved)
    const { error: approveErr } = await supabase
      .from(item.table as never)
      .update({ status: 'approved' } as never)
      .eq('id', item.id)
      .eq('status', 'review' as never)

    if (approveErr) {
      const msg = `${label}: approve failed — ${approveErr.message}`
      console.log(`  ✗ ${dateStr} ${msg}`)
      errors.push(msg)
      continue
    }
    approved++

    // Step 2: Insert calendar entry
    const { error: calErr } = await supabase.from('content_calendar').insert({
      organization_id: ORG_ID,
      content_type: item.contentType,
      content_id: item.id,
      scheduled_at: item.scheduledAt,
      status: 'scheduled',
      created_by: userId,
    } as never)

    if (calErr) {
      if (calErr.code === '23505') {
        console.log(`  ⚠ ${dateStr} ${label}: already scheduled — skipped`)
      } else {
        const msg = `${label}: calendar insert failed — ${calErr.message}`
        console.log(`  ✗ ${dateStr} ${msg}`)
        errors.push(msg)
      }
      continue
    }
    scheduled++
    console.log(`  ✓ ${dateStr} ${label}`)
  }

  return { approved, scheduled, errors }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Staggered Content Publishing Schedule ===')
  console.log(`Date: ${new Date().toISOString().slice(0, 10)}`)
  if (dryRun) console.log('[DRY RUN — no changes will be made]')

  // Determine start date (default: tomorrow)
  let startDate: Date
  if (startDateStr) {
    startDate = new Date(startDateStr + 'T00:00:00Z')
    if (isNaN(startDate.getTime())) {
      console.error(`Invalid --start-date: ${startDateStr}`)
      process.exit(1)
    }
  } else {
    startDate = new Date()
    startDate.setDate(startDate.getDate() + 1)
    startDate.setUTCHours(0, 0, 0, 0)
  }
  console.log(`Start date: ${startDate.toISOString().slice(0, 10)}`)

  // Fetch review-status content
  const { locations, blogs, social } = await fetchReviewContent()

  console.log(`\nFound review-status content:`)
  console.log(`  Location pages: ${locations.length}`)
  for (const l of locations) console.log(`    - ${l.title}`)
  console.log(`  Blog posts:     ${blogs.length}`)
  for (const b of blogs) console.log(`    - ${b.title}`)
  console.log(`  Social posts:   ${social.length}`)
  for (const s of social) {
    const label = s.title || s.body.slice(0, 50) + '...'
    console.log(`    - [${s.platform}] ${label}`)
  }

  const totalContent = locations.length + blogs.length + social.length
  if (totalContent === 0) {
    console.log('\nNo review-status content found. Nothing to schedule.')
    return
  }

  // Build schedule
  const schedule = buildSchedule(locations, blogs, social, startDate)

  // Print preview
  console.log(`\nPublishing Schedule (${schedule.length} items):`)
  printSchedule(schedule)

  const firstDate = schedule[0]?.scheduledAt.slice(0, 10) ?? '?'
  const lastDate = schedule[schedule.length - 1]?.scheduledAt.slice(0, 10) ?? '?'
  console.log(`\n  Date range: ${firstDate} → ${lastDate}`)

  if (dryRun) {
    console.log('\n[DRY RUN — no changes made. Remove --dry-run to execute.]')
    return
  }

  // Execute
  console.log('\nExecuting...\n')
  const userId = await getOrgUserId()
  const { approved, scheduled, errors } = await executeSchedule(schedule, userId)

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('  Summary')
  console.log('='.repeat(60))
  console.log(`  Items approved:  ${approved}`)
  console.log(`  Items scheduled: ${scheduled}`)
  console.log(`  Errors:          ${errors.length}`)
  if (errors.length > 0) {
    for (const err of errors) console.log(`    - ${err}`)
  }
  console.log(`  Date range:      ${firstDate} → ${lastDate}`)
  console.log('\n  Content will auto-publish at scheduled times via the publish worker.')
  console.log('  View the schedule in Dashboard → Calendar.\n')
  console.log('=== Schedule Complete ===\n')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
