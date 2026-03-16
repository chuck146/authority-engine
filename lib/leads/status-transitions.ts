import type { LeadStatus } from '@/types/leads'
import type { UserRole } from '@/types'

const VALID_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new: ['contacted', 'qualified', 'lost'],
  contacted: ['qualified', 'proposed', 'lost'],
  qualified: ['proposed', 'won', 'lost'],
  proposed: ['won', 'lost'],
  won: [],
  lost: ['new'],
}

const ACTION_MAP: Record<string, LeadStatus> = {
  contact: 'contacted',
  qualify: 'qualified',
  propose: 'proposed',
  win: 'won',
  lose: 'lost',
  reopen: 'new',
}

const ACTION_ROLE_REQUIREMENTS: Record<string, UserRole> = {
  contact: 'editor',
  qualify: 'editor',
  propose: 'editor',
  win: 'admin',
  lose: 'admin',
  reopen: 'admin',
}

const ROLE_HIERARCHY: UserRole[] = ['viewer', 'editor', 'admin', 'owner']

export function getLeadTargetStatus(action: string): LeadStatus | null {
  return ACTION_MAP[action] ?? null
}

export function isValidLeadTransition(from: LeadStatus, to: LeadStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export function getLeadRequiredRole(action: string): UserRole | null {
  return ACTION_ROLE_REQUIREMENTS[action] ?? null
}

export function getAvailableLeadActions(status: LeadStatus, role: UserRole): string[] {
  const userLevel = ROLE_HIERARCHY.indexOf(role)

  return Object.entries(ACTION_MAP)
    .filter(([action, targetStatus]) => {
      const requiredRole = ACTION_ROLE_REQUIREMENTS[action]
      if (!requiredRole) return false
      const requiredLevel = ROLE_HIERARCHY.indexOf(requiredRole)
      if (userLevel < requiredLevel) return false
      return isValidLeadTransition(status, targetStatus)
    })
    .map(([action]) => action)
}
