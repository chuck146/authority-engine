import type { ContentStatus, UserRole } from '@/types'

const VALID_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  draft: ['review'],
  review: ['approved', 'draft', 'archived'],
  approved: ['published', 'archived'],
  published: ['archived'],
  archived: [],
}

const ACTION_MAP: Record<string, ContentStatus> = {
  approve: 'approved',
  reject: 'draft',
  publish: 'published',
  archive: 'archived',
}

const ACTION_ROLE_REQUIREMENTS: Record<string, UserRole> = {
  approve: 'admin',
  reject: 'admin',
  publish: 'admin',
  archive: 'admin',
}

const ROLE_HIERARCHY: UserRole[] = ['viewer', 'editor', 'admin', 'owner']

export function getTargetStatus(action: string): ContentStatus | null {
  return ACTION_MAP[action] ?? null
}

export function isValidTransition(from: ContentStatus, to: ContentStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export function getRequiredRole(action: string): UserRole | null {
  return ACTION_ROLE_REQUIREMENTS[action] ?? null
}

export function getAvailableActions(status: ContentStatus, role: UserRole): string[] {
  const userLevel = ROLE_HIERARCHY.indexOf(role)

  return Object.entries(ACTION_MAP)
    .filter(([action, targetStatus]) => {
      const requiredRole = ACTION_ROLE_REQUIREMENTS[action]
      if (!requiredRole) return false
      const requiredLevel = ROLE_HIERARCHY.indexOf(requiredRole)
      if (userLevel < requiredLevel) return false
      return isValidTransition(status, targetStatus)
    })
    .map(([action]) => action)
}
