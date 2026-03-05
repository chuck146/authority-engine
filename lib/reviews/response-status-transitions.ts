import type { ReviewResponseStatus } from '@/types/reviews'
import type { UserRole } from '@/types'

const VALID_TRANSITIONS: Record<ReviewResponseStatus, ReviewResponseStatus[]> = {
  pending: ['draft', 'review', 'archived'],
  draft: ['review', 'archived'],
  review: ['approved', 'draft', 'archived'],
  approved: ['sent', 'archived'],
  sent: ['archived'],
  archived: [],
}

const ACTION_MAP: Record<string, ReviewResponseStatus> = {
  submit_for_review: 'review',
  approve: 'approved',
  reject: 'draft',
  mark_sent: 'sent',
  archive: 'archived',
}

const ACTION_ROLE_REQUIREMENTS: Record<string, UserRole> = {
  submit_for_review: 'editor',
  approve: 'admin',
  reject: 'admin',
  mark_sent: 'admin',
  archive: 'admin',
}

const ROLE_HIERARCHY: UserRole[] = ['viewer', 'editor', 'admin', 'owner']

export function getResponseTargetStatus(action: string): ReviewResponseStatus | null {
  return ACTION_MAP[action] ?? null
}

export function isValidResponseTransition(
  from: ReviewResponseStatus,
  to: ReviewResponseStatus,
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export function getResponseRequiredRole(action: string): UserRole | null {
  return ACTION_ROLE_REQUIREMENTS[action] ?? null
}

export function getAvailableResponseActions(
  status: ReviewResponseStatus,
  role: UserRole,
): string[] {
  const userLevel = ROLE_HIERARCHY.indexOf(role)

  return Object.entries(ACTION_MAP)
    .filter(([action, targetStatus]) => {
      const requiredRole = ACTION_ROLE_REQUIREMENTS[action]
      if (!requiredRole) return false
      const requiredLevel = ROLE_HIERARCHY.indexOf(requiredRole)
      if (userLevel < requiredLevel) return false
      return isValidResponseTransition(status, targetStatus)
    })
    .map(([action]) => action)
}
