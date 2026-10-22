import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import type { LeadOverview, LeadStatus, LeadSource } from '@/types/leads'

const QUALIFIED_STATUSES = new Set(['qualified', 'proposed', 'won'])

export async function GET() {
  try {
    const auth = await requireApiAuth()
    const supabase = await createClient()

    // Only the columns the counts need (no names, emails, or phone numbers).
    const BASE_COLUMNS = 'status, source, service, created_at, contacted_at'
    const fetchLeads = (columns: string) =>
      supabase
        .from('leads' as never)
        .select(columns)
        .eq('organization_id', auth.organizationId)
        .returns<
          {
            status: string
            source: string
            service: string | null
            created_at: string
            contacted_at: string | null
            discovery_source?: string | null
            attribution?: { channel?: string } | null
          }[]
        >()

    let { data: leads, error } = await fetchLeads(`${BASE_COLUMNS}, discovery_source, attribution`)
    // TODO: remove once migration 20261019000001 is applied — before then the
    // attribution columns don't exist (42703 undefined_column).
    if (error?.code === '42703') {
      ;({ data: leads, error } = await fetchLeads(BASE_COLUMNS))
    }

    if (error) {
      console.error('Failed to fetch leads overview:', error)
      return NextResponse.json({ error: 'Failed to fetch overview' }, { status: 500 })
    }

    const allLeads = leads ?? []
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // By status
    const byStatus: Record<LeadStatus, number> = {
      new: 0,
      contacted: 0,
      qualified: 0,
      proposed: 0,
      won: 0,
      lost: 0,
    }
    for (const lead of allLeads) {
      const s = lead.status as LeadStatus
      if (s in byStatus) byStatus[s]++
    }

    // New this week
    const newThisWeek = allLeads.filter(
      (l) => l.status === 'new' && new Date(l.created_at) >= oneWeekAgo,
    ).length

    // In pipeline (not won/lost)
    const inPipeline = allLeads.filter((l) => l.status !== 'won' && l.status !== 'lost').length

    // Conversion rate
    const totalClosed = byStatus.won + byStatus.lost
    const conversionRate = totalClosed > 0 ? byStatus.won / totalClosed : 0

    // By source
    const sourceMap = new Map<string, number>()
    for (const lead of allLeads) {
      const src = lead.source ?? 'website'
      sourceMap.set(src, (sourceMap.get(src) ?? 0) + 1)
    }
    const bySource = Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source: source as LeadSource, count }))
      .sort((a, b) => b.count - a.count)

    // Top services
    const serviceMap = new Map<string, number>()
    for (const lead of allLeads) {
      if (lead.service) {
        serviceMap.set(lead.service, (serviceMap.get(lead.service) ?? 0) + 1)
      }
    }
    const topServices = Array.from(serviceMap.entries())
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Avg response time (time from created_at to contacted_at)
    const responseTimes = allLeads
      .filter((l) => l.contacted_at)
      .map((l) => {
        const created = new Date(l.created_at).getTime()
        const contacted = new Date(l.contacted_at!).getTime()
        return (contacted - created) / (1000 * 60 * 60) // hours
      })
    const avgResponseTimeHours =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        : null

    // By observed channel, with lead quality downstream
    const channelMap = new Map<string, { leads: number; qualified: number; won: number }>()
    for (const lead of allLeads) {
      const channel = lead.attribution?.channel ?? 'unknown'
      const row = channelMap.get(channel) ?? { leads: 0, qualified: 0, won: 0 }
      row.leads++
      if (QUALIFIED_STATUSES.has(lead.status)) row.qualified++
      if (lead.status === 'won') row.won++
      channelMap.set(channel, row)
    }
    const byChannel = Array.from(channelMap.entries())
      .map(([channel, row]) => ({ channel, ...row }))
      .sort((a, b) => b.leads - a.leads)

    // By customer-reported discovery source
    const discoveryMap = new Map<string, number>()
    for (const lead of allLeads) {
      if (lead.discovery_source) {
        discoveryMap.set(lead.discovery_source, (discoveryMap.get(lead.discovery_source) ?? 0) + 1)
      }
    }
    const byDiscoverySource = Array.from(discoveryMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)

    const overview: LeadOverview = {
      total: allLeads.length,
      newThisWeek,
      inPipeline,
      conversionRate,
      byStatus,
      bySource,
      topServices,
      avgResponseTimeHours,
      byChannel,
      byDiscoverySource,
    }

    return NextResponse.json(overview)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
