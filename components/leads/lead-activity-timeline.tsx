'use client'

import { useState } from 'react'
import {
  MessageSquare,
  Mail,
  Phone,
  FileText,
  ArrowRight,
  Bot,
  TrendingUp,
  UserPlus,
  Bell,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LeadActivity, LeadActivityType } from '@/types/leads'

const ICON_MAP: Record<LeadActivityType, typeof MessageSquare> = {
  sms_sent: MessageSquare,
  sms_received: MessageSquare,
  email_sent: Mail,
  email_received: Mail,
  phone_call: Phone,
  note: FileText,
  status_change: ArrowRight,
  assignment_change: UserPlus,
  score_change: TrendingUp,
  followup_triggered: Bell,
  ai_call: Bot,
  ai_text: Bot,
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDays = Math.floor(diffHr / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

type LeadActivityTimelineProps = {
  activities: LeadActivity[]
  compact?: boolean
}

export function LeadActivityTimeline({ activities, compact = false }: LeadActivityTimelineProps) {
  const [showAll, setShowAll] = useState(false)
  const displayed = compact && !showAll ? activities.slice(0, 4) : activities

  if (activities.length === 0) {
    return <p className="text-muted-foreground text-sm">No activity yet.</p>
  }

  return (
    <div className="space-y-0">
      <div className="border-muted relative border-l-2 pl-4">
        {displayed.map((activity) => {
          const Icon = ICON_MAP[activity.activityType] ?? FileText
          return (
            <div key={activity.id} className="relative mb-4 last:mb-0">
              <div className="bg-background border-muted absolute top-0.5 -left-[calc(0.5rem+1px+1rem)] flex h-5 w-5 items-center justify-center rounded-full border-2">
                <Icon className="text-muted-foreground h-3 w-3" />
              </div>
              <div>
                <p className="text-sm">{activity.description}</p>
                <p className="text-muted-foreground text-xs">
                  {formatRelativeTime(activity.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
      {compact && activities.length > 4 && !showAll && (
        <Button variant="ghost" size="sm" onClick={() => setShowAll(true)} className="mt-2">
          Show all ({activities.length})
        </Button>
      )}
    </div>
  )
}
