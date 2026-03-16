import type { LeadScoreLabel } from '@/types/leads'

type ScoreInput = {
  service: string | null
  message: string | null
  phone: string | null
  email: string | null
  createdAt: string | Date
}

type ScoreResult = {
  score: number
  scoreLabel: LeadScoreLabel
  reasons: string[]
}

const HIGH_VALUE_SERVICES = [
  'exterior painting',
  'full house painting',
  'commercial painting',
  'cabinet painting',
  'deck staining',
]
const MID_VALUE_SERVICES = [
  'interior painting',
  'room painting',
  'kitchen painting',
  'bathroom painting',
]

export function scoreLead(input: ScoreInput): ScoreResult {
  let score = 0
  const reasons: string[] = []

  // Service value scoring
  if (input.service) {
    const serviceLower = input.service.toLowerCase()
    if (HIGH_VALUE_SERVICES.some((s) => serviceLower.includes(s))) {
      score += 30
      reasons.push('High-value service requested')
    } else if (MID_VALUE_SERVICES.some((s) => serviceLower.includes(s))) {
      score += 20
      reasons.push('Mid-value service requested')
    } else {
      score += 10
      reasons.push('Service requested')
    }
  }

  // Message engagement scoring
  if (input.message) {
    const len = input.message.length
    if (len >= 200) {
      score += 15
      reasons.push('Detailed message (200+ chars)')
    } else if (len >= 50) {
      score += 10
      reasons.push('Message provided (50-200 chars)')
    } else {
      score += 5
      reasons.push('Brief message provided')
    }
  }

  // Contact completeness scoring
  if (input.phone && input.email) {
    score += 10
    reasons.push('Both phone and email provided')
  }

  // Recency scoring
  const now = new Date()
  const created = new Date(input.createdAt)
  const hoursAgo = (now.getTime() - created.getTime()) / (1000 * 60 * 60)

  if (hoursAgo < 1) {
    score += 20
    reasons.push('Submitted within last hour')
  } else if (hoursAgo < 24) {
    score += 15
    reasons.push('Submitted within last 24 hours')
  } else if (hoursAgo < 72) {
    score += 10
    reasons.push('Submitted within last 3 days')
  } else {
    score += 5
    reasons.push('Submitted over 3 days ago')
  }

  // Clamp to 0–100
  score = Math.min(100, Math.max(0, score))

  const scoreLabel: LeadScoreLabel = score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold'

  return { score, scoreLabel, reasons }
}
