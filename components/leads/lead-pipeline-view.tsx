'use client'

import { useState, useEffect, useCallback } from 'react'
import { LeadScoreBadge } from './lead-score-badge'
import { LeadDetailSheet } from './lead-detail-sheet'
import type { LeadListItem, LeadStatus } from '@/types/leads'

const PIPELINE_COLUMNS: { status: LeadStatus; label: string; muted?: boolean }[] = [
  { status: 'new', label: 'New' },
  { status: 'contacted', label: 'Contacted' },
  { status: 'qualified', label: 'Qualified' },
  { status: 'proposed', label: 'Proposed' },
  { status: 'won', label: 'Won', muted: true },
  { status: 'lost', label: 'Lost', muted: true },
]

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDays = Math.floor(diffHr / 24)
  return `${diffDays}d ago`
}

type LeadPipelineViewProps = {
  refreshKey?: number
}

export function LeadPipelineView({ refreshKey }: LeadPipelineViewProps) {
  const [leads, setLeads] = useState<LeadListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/leads?limit=50&sortBy=created_at&sortDir=desc')
      if (res.ok) {
        const data = await res.json()
        setLeads(data.items)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads, refreshKey])

  function handleCardClick(id: string) {
    setSelectedId(id)
    setSheetOpen(true)
  }

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading pipeline...</p>
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {PIPELINE_COLUMNS.map((col) => {
          const columnLeads = leads.filter((l) => l.status === col.status)
          return (
            <div
              key={col.status}
              className={`min-w-[220px] flex-1 rounded-lg border p-3 ${
                col.muted ? 'bg-muted/30' : 'bg-background'
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <span className="bg-muted rounded-full px-2 py-0.5 text-xs font-medium">
                  {columnLeads.length}
                </span>
              </div>
              <div className="space-y-2">
                {columnLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="cursor-pointer rounded-md border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
                    onClick={() => handleCardClick(lead.id)}
                  >
                    <p className="text-sm font-medium">{lead.name}</p>
                    {lead.service && (
                      <p className="text-muted-foreground mt-0.5 text-xs">{lead.service}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <LeadScoreBadge score={lead.score} scoreLabel={lead.scoreLabel} />
                      <span className="text-muted-foreground text-xs">
                        {formatRelativeTime(lead.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
                {columnLeads.length === 0 && (
                  <p className="text-muted-foreground py-4 text-center text-xs">No leads</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <LeadDetailSheet
        leadId={selectedId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUpdated={fetchLeads}
      />
    </>
  )
}
