'use client'

import { Badge } from '@/components/ui/badge'

type SeoScoreBadgeProps = {
  score: number | null
  showLabel?: boolean
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-800 hover:bg-green-100'
  if (score >= 60) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
  if (score >= 40) return 'bg-orange-100 text-orange-800 hover:bg-orange-100'
  return 'bg-red-100 text-red-800 hover:bg-red-100'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Needs Work'
  return 'Poor'
}

export function SeoScoreBadge({ score, showLabel = false }: SeoScoreBadgeProps) {
  if (score === null) {
    return <Badge variant="secondary">--</Badge>
  }

  return (
    <Badge className={getScoreColor(score)}>
      {score}/100{showLabel && ` · ${getScoreLabel(score)}`}
    </Badge>
  )
}
