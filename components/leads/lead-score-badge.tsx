'use client'

import type { LeadScoreLabel } from '@/types/leads'

const SCORE_STYLES: Record<LeadScoreLabel, string> = {
  hot: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  warm: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  cold: 'bg-muted text-muted-foreground',
}

type LeadScoreBadgeProps = {
  score: number
  scoreLabel: LeadScoreLabel | null
}

export function LeadScoreBadge({ score, scoreLabel }: LeadScoreBadgeProps) {
  const label = scoreLabel ?? 'cold'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${SCORE_STYLES[label]}`}
    >
      {label.charAt(0).toUpperCase() + label.slice(1)}
      <span className="opacity-60">{score}</span>
    </span>
  )
}
