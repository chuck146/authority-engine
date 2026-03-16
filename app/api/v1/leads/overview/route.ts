import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import type { LeadOverview, LeadStatus, LeadSource } from '@/types/leads'

export async function GET() {
  try {
    const auth = await requireApiAuth()
    const supabase = await createClient()

    // Fetch all leads for the org
    const { data: leads, error } = await supabase
      .from('leads' as never)
      .select('status, source, service, created_at, contacted_at')
      .eq('organization_id', auth.organizationId)
      .returns<
        {
          status: string
          source: string
          service: string | null
          created_at: string
          contacted_at: string | null
        }[]
      >()

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

    const overview: LeadOverview = {
      total: allLeads.length,
      newThisWeek,
      inPipeline,
      conversionRate,
      byStatus,
      bySource,
      topServices,
      avgResponseTimeHours,
    }

    return NextResponse.json(overview)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
