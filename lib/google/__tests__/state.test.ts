import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createOAuthState, validateOAuthState } from '../state'

const TEST_KEY = 'b'.repeat(64)

beforeEach(() => {
  vi.stubEnv('GSC_ENCRYPTION_KEY', TEST_KEY)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('createOAuthState / validateOAuthState', () => {
  it('creates a valid state and validates it', () => {
    const state = createOAuthState('org-123')
    const result = validateOAuthState(state)
    expect(result).toEqual({ organizationId: 'org-123' })
  })

  it('produces different states each time (random nonce)', () => {
    const a = createOAuthState('org-123')
    const b = createOAuthState('org-123')
    expect(a).not.toBe(b)
  })

  it('returns null for tampered signature', () => {
    const state = createOAuthState('org-123')
    const parts = state.split('.')
    const tampered = `${parts[0]}.${parts[1]}.tampered-sig`
    expect(validateOAuthState(tampered)).toBeNull()
  })

  it('returns null for tampered org ID', () => {
    const state = createOAuthState('org-123')
    const parts = state.split('.')
    const tampered = `org-evil.${parts[1]}.${parts[2]}`
    expect(validateOAuthState(tampered)).toBeNull()
  })

  it('returns null for missing parts', () => {
    expect(validateOAuthState('only-one-part')).toBeNull()
    expect(validateOAuthState('two.parts')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(validateOAuthState('')).toBeNull()
  })
})
