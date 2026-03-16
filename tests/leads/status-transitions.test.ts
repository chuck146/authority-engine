import { describe, it, expect } from 'vitest'
import {
  getLeadTargetStatus,
  isValidLeadTransition,
  getLeadRequiredRole,
  getAvailableLeadActions,
} from '@/lib/leads/status-transitions'

describe('Lead Status Transitions', () => {
  describe('getLeadTargetStatus', () => {
    it('returns correct status for each action', () => {
      expect(getLeadTargetStatus('contact')).toBe('contacted')
      expect(getLeadTargetStatus('qualify')).toBe('qualified')
      expect(getLeadTargetStatus('propose')).toBe('proposed')
      expect(getLeadTargetStatus('win')).toBe('won')
      expect(getLeadTargetStatus('lose')).toBe('lost')
      expect(getLeadTargetStatus('reopen')).toBe('new')
    })

    it('returns null for unknown action', () => {
      expect(getLeadTargetStatus('unknown')).toBeNull()
      expect(getLeadTargetStatus('')).toBeNull()
    })
  })

  describe('isValidLeadTransition', () => {
    it('allows valid transitions', () => {
      expect(isValidLeadTransition('new', 'contacted')).toBe(true)
      expect(isValidLeadTransition('new', 'qualified')).toBe(true)
      expect(isValidLeadTransition('new', 'lost')).toBe(true)
      expect(isValidLeadTransition('contacted', 'qualified')).toBe(true)
      expect(isValidLeadTransition('contacted', 'proposed')).toBe(true)
      expect(isValidLeadTransition('qualified', 'won')).toBe(true)
      expect(isValidLeadTransition('proposed', 'won')).toBe(true)
      expect(isValidLeadTransition('lost', 'new')).toBe(true)
    })

    it('rejects invalid transitions', () => {
      expect(isValidLeadTransition('new', 'won')).toBe(false)
      expect(isValidLeadTransition('new', 'proposed')).toBe(false)
      expect(isValidLeadTransition('won', 'contacted')).toBe(false)
      expect(isValidLeadTransition('won', 'new')).toBe(false)
      expect(isValidLeadTransition('lost', 'contacted')).toBe(false)
    })
  })

  describe('getLeadRequiredRole', () => {
    it('returns editor for contact/qualify/propose', () => {
      expect(getLeadRequiredRole('contact')).toBe('editor')
      expect(getLeadRequiredRole('qualify')).toBe('editor')
      expect(getLeadRequiredRole('propose')).toBe('editor')
    })

    it('returns admin for win/lose/reopen', () => {
      expect(getLeadRequiredRole('win')).toBe('admin')
      expect(getLeadRequiredRole('lose')).toBe('admin')
      expect(getLeadRequiredRole('reopen')).toBe('admin')
    })

    it('returns null for unknown action', () => {
      expect(getLeadRequiredRole('unknown')).toBeNull()
    })
  })

  describe('getAvailableLeadActions', () => {
    it('returns contact/qualify/lose for new lead as editor', () => {
      const actions = getAvailableLeadActions('new', 'editor')
      expect(actions).toContain('contact')
      expect(actions).toContain('qualify')
      expect(actions).not.toContain('win')
      expect(actions).not.toContain('lose') // requires admin
    })

    it('returns all actions for new lead as admin', () => {
      const actions = getAvailableLeadActions('new', 'admin')
      expect(actions).toContain('contact')
      expect(actions).toContain('qualify')
      expect(actions).toContain('lose')
    })

    it('returns reopen for lost lead as admin', () => {
      const actions = getAvailableLeadActions('lost', 'admin')
      expect(actions).toContain('reopen')
    })

    it('returns no actions for won lead', () => {
      const actions = getAvailableLeadActions('won', 'admin')
      expect(actions).toHaveLength(0)
    })

    it('returns no actions for viewer', () => {
      const actions = getAvailableLeadActions('new', 'viewer')
      expect(actions).toHaveLength(0)
    })
  })
})
