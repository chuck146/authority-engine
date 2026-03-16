'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Phone, MessageSquare, Mail, Bot } from 'lucide-react'
import { LeadStatusBadge } from './lead-status-badge'
import { LeadScoreBadge } from './lead-score-badge'
import { LeadActivityTimeline } from './lead-activity-timeline'
import { LeadSendSmsForm } from './lead-send-sms-form'
import { LeadSendEmailForm } from './lead-send-email-form'
import type { LeadDetail, LeadStatus } from '@/types/leads'

const PIPELINE_STAGES: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposed', 'won']

type LeadDetailSheetProps = {
  leadId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: () => void
}

export function LeadDetailSheet({ leadId, open, onOpenChange, onUpdated }: LeadDetailSheetProps) {
  const [lead, setLead] = useState<LeadDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [showSms, setShowSms] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  const fetchLead = useCallback(async () => {
    if (!leadId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/leads/${leadId}`)
      if (res.ok) {
        const data = await res.json()
        setLead(data)
        setNotes(data.notes ?? '')
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [leadId])

  useEffect(() => {
    if (open && leadId) {
      fetchLead()
      setShowSms(false)
      setShowEmail(false)
    }
  }, [open, leadId, fetchLead])

  async function handleStatusChange(newStatus: LeadStatus) {
    if (!leadId) return
    const res = await fetch(`/api/v1/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      fetchLead()
      onUpdated()
    }
  }

  async function handleSaveNotes() {
    if (!leadId) return
    setSavingNotes(true)
    const res = await fetch(`/api/v1/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
    if (res.ok) fetchLead()
    setSavingNotes(false)
  }

  async function handleAddNote() {
    if (!leadId || !noteText.trim()) return
    setAddingNote(true)
    const res = await fetch(`/api/v1/leads/${leadId}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activityType: 'note', description: noteText }),
    })
    if (res.ok) {
      setNoteText('')
      fetchLead()
    }
    setAddingNote(false)
  }

  function handleActionSent() {
    setShowSms(false)
    setShowEmail(false)
    fetchLead()
    onUpdated()
  }

  function getNextActions(status: LeadStatus): { label: string; target: LeadStatus }[] {
    const actions: { label: string; target: LeadStatus }[] = []
    if (status === 'new') {
      actions.push({ label: 'Mark Contacted', target: 'contacted' })
      actions.push({ label: 'Qualify', target: 'qualified' })
    } else if (status === 'contacted') {
      actions.push({ label: 'Qualify', target: 'qualified' })
      actions.push({ label: 'Send Proposal', target: 'proposed' })
    } else if (status === 'qualified') {
      actions.push({ label: 'Send Proposal', target: 'proposed' })
      actions.push({ label: 'Mark Won', target: 'won' })
    } else if (status === 'proposed') {
      actions.push({ label: 'Mark Won', target: 'won' })
    }
    if (status !== 'won' && status !== 'lost') {
      actions.push({ label: 'Mark Lost', target: 'lost' })
    }
    if (status === 'lost') {
      actions.push({ label: 'Reopen', target: 'new' })
    }
    return actions
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{lead?.name ?? 'Lead Details'}</SheetTitle>
        </SheetHeader>

        {loading && <p className="text-muted-foreground p-4 text-sm">Loading...</p>}

        {lead && !loading && (
          <div className="space-y-6 p-4">
            {/* Header info */}
            <div>
              <p className="text-muted-foreground text-sm">
                {lead.service ?? 'No service specified'}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <LeadStatusBadge status={lead.status} />
                <LeadScoreBadge score={lead.score} scoreLabel={lead.scoreLabel} />
              </div>
            </div>

            {/* Contact bar */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild>
                <a href={`tel:${lead.phone}`}>
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant={showSms ? 'default' : 'outline'}
                size="icon"
                onClick={() => {
                  setShowSms(!showSms)
                  setShowEmail(false)
                }}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button
                variant={showEmail ? 'default' : 'outline'}
                size="icon"
                onClick={() => {
                  setShowEmail(!showEmail)
                  setShowSms(false)
                }}
              >
                <Mail className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" disabled title="AI Agent — Coming Soon">
                <Bot className="h-4 w-4" />
              </Button>
            </div>

            {/* Inline SMS/Email forms */}
            {showSms && (
              <LeadSendSmsForm leadId={lead.id} leadName={lead.name} onSent={handleActionSent} />
            )}
            {showEmail && (
              <LeadSendEmailForm leadId={lead.id} leadName={lead.name} onSent={handleActionSent} />
            )}

            {/* Pipeline indicator */}
            <div className="flex items-center gap-1">
              {PIPELINE_STAGES.map((stage) => {
                const idx = PIPELINE_STAGES.indexOf(stage)
                const currentIdx = PIPELINE_STAGES.indexOf(lead.status)
                const isLost = lead.status === 'lost'
                const isCurrent = stage === lead.status
                const isCompleted = !isLost && idx < currentIdx

                return (
                  <div key={stage} className="flex items-center gap-1">
                    <div
                      className={`h-3 w-3 rounded-full border-2 ${
                        isCurrent
                          ? 'border-primary bg-primary'
                          : isCompleted
                            ? 'border-primary bg-primary/30'
                            : 'border-muted bg-transparent'
                      }`}
                      title={stage}
                    />
                    {idx < PIPELINE_STAGES.length - 1 && (
                      <div className={`h-0.5 w-4 ${isCompleted ? 'bg-primary/50' : 'bg-muted'}`} />
                    )}
                  </div>
                )
              })}
              {lead.status === 'lost' && <span className="ml-2 text-xs text-red-500">Lost</span>}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {getNextActions(lead.status).map((action) => (
                <Button
                  key={action.target}
                  variant={
                    action.target === 'lost'
                      ? 'destructive'
                      : action.target === 'won'
                        ? 'default'
                        : 'outline'
                  }
                  size="sm"
                  onClick={() => handleStatusChange(action.target)}
                >
                  {action.label}
                </Button>
              ))}
            </div>

            {/* Details */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <a href={`mailto:${lead.email}`} className="text-primary">
                  {lead.email}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <a href={`tel:${lead.phone}`} className="text-primary">
                  {lead.phone}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source</span>
                <span className="capitalize">{lead.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted</span>
                <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
              </div>
              {lead.message && (
                <div>
                  <p className="text-muted-foreground mb-1">Message</p>
                  <p className="bg-muted rounded-md p-2 text-sm">{lead.message}</p>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Notes</p>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes..."
                rows={3}
              />
              {notes !== (lead.notes ?? '') && (
                <Button size="sm" onClick={handleSaveNotes} disabled={savingNotes}>
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </Button>
              )}
            </div>

            {/* Activity Timeline */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Activity</p>
              <LeadActivityTimeline activities={lead.activities} compact />
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={addingNote || !noteText.trim()}
                  className="self-end"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Follow-ups */}
            {lead.followups.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Follow-ups</p>
                {lead.followups.map((f) => (
                  <div
                    key={f.id}
                    className="bg-muted flex items-center justify-between rounded-md p-2 text-sm"
                  >
                    <div>
                      <span className="capitalize">{f.channel}</span> — Step {f.stepNumber}
                      <span className="text-muted-foreground ml-2">
                        {new Date(f.scheduledAt).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-xs capitalize">{f.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
