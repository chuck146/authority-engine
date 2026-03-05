import { describe, it, expect } from 'vitest'
import {
  getResponseTargetStatus,
  isValidResponseTransition,
  getResponseRequiredRole,
  getAvailableResponseActions,
} from '../response-status-transitions'

describe('getResponseTargetStatus', () => {
  it('maps submit_for_review to review', () => {
    expect(getResponseTargetStatus('submit_for_review')).toBe('review')
  })

  it('maps approve to approved', () => {
    expect(getResponseTargetStatus('approve')).toBe('approved')
  })

  it('maps reject to draft', () => {
    expect(getResponseTargetStatus('reject')).toBe('draft')
  })

  it('maps mark_sent to sent', () => {
    expect(getResponseTargetStatus('mark_sent')).toBe('sent')
  })

  it('maps archive to archived', () => {
    expect(getResponseTargetStatus('archive')).toBe('archived')
  })

  it('returns null for unknown action', () => {
    expect(getResponseTargetStatus('invalid')).toBeNull()
  })
})

describe('isValidResponseTransition', () => {
  // pending transitions
  it('pending → draft is valid', () => {
    expect(isValidResponseTransition('pending', 'draft')).toBe(true)
  })

  it('pending → review is valid', () => {
    expect(isValidResponseTransition('pending', 'review')).toBe(true)
  })

  it('pending → archived is valid', () => {
    expect(isValidResponseTransition('pending', 'archived')).toBe(true)
  })

  it('pending → approved is invalid', () => {
    expect(isValidResponseTransition('pending', 'approved')).toBe(false)
  })

  // draft transitions
  it('draft → review is valid', () => {
    expect(isValidResponseTransition('draft', 'review')).toBe(true)
  })

  it('draft → approved is invalid', () => {
    expect(isValidResponseTransition('draft', 'approved')).toBe(false)
  })

  // review transitions
  it('review → approved is valid', () => {
    expect(isValidResponseTransition('review', 'approved')).toBe(true)
  })

  it('review → draft (reject) is valid', () => {
    expect(isValidResponseTransition('review', 'draft')).toBe(true)
  })

  it('review → sent is invalid', () => {
    expect(isValidResponseTransition('review', 'sent')).toBe(false)
  })

  // approved transitions
  it('approved → sent is valid', () => {
    expect(isValidResponseTransition('approved', 'sent')).toBe(true)
  })

  it('approved → draft is invalid', () => {
    expect(isValidResponseTransition('approved', 'draft')).toBe(false)
  })

  // sent transitions
  it('sent → archived is valid', () => {
    expect(isValidResponseTransition('sent', 'archived')).toBe(true)
  })

  it('sent → draft is invalid', () => {
    expect(isValidResponseTransition('sent', 'draft')).toBe(false)
  })

  // archived transitions
  it('archived → anything is invalid', () => {
    expect(isValidResponseTransition('archived', 'pending')).toBe(false)
    expect(isValidResponseTransition('archived', 'draft')).toBe(false)
    expect(isValidResponseTransition('archived', 'review')).toBe(false)
  })
})

describe('getResponseRequiredRole', () => {
  it('requires editor for submit_for_review', () => {
    expect(getResponseRequiredRole('submit_for_review')).toBe('editor')
  })

  it('requires admin for approve', () => {
    expect(getResponseRequiredRole('approve')).toBe('admin')
  })

  it('requires admin for reject', () => {
    expect(getResponseRequiredRole('reject')).toBe('admin')
  })

  it('requires admin for mark_sent', () => {
    expect(getResponseRequiredRole('mark_sent')).toBe('admin')
  })

  it('requires admin for archive', () => {
    expect(getResponseRequiredRole('archive')).toBe('admin')
  })

  it('returns null for unknown action', () => {
    expect(getResponseRequiredRole('invalid')).toBeNull()
  })
})

describe('getAvailableResponseActions', () => {
  it('returns submit_for_review and archive for draft as editor', () => {
    const actions = getAvailableResponseActions('draft', 'editor')
    expect(actions).toContain('submit_for_review')
    expect(actions).not.toContain('approve')
  })

  it('returns approve, reject, archive for review as admin', () => {
    const actions = getAvailableResponseActions('review', 'admin')
    expect(actions).toContain('approve')
    expect(actions).toContain('reject')
    expect(actions).toContain('archive')
  })

  it('returns mark_sent and archive for approved as admin', () => {
    const actions = getAvailableResponseActions('approved', 'admin')
    expect(actions).toContain('mark_sent')
    expect(actions).toContain('archive')
  })

  it('returns archive for sent as admin', () => {
    const actions = getAvailableResponseActions('sent', 'admin')
    expect(actions).toContain('archive')
  })

  it('returns nothing for archived', () => {
    const actions = getAvailableResponseActions('archived', 'owner')
    expect(actions).toHaveLength(0)
  })

  it('viewer cannot do any actions', () => {
    const actions = getAvailableResponseActions('review', 'viewer')
    expect(actions).toHaveLength(0)
  })
})
