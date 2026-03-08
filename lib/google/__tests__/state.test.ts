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
    const state = createOAuthState('org-123', 'user-456')
    const result = validateOAuthState(state)
    expect(result).toEqual({
      organizationId: 'org-123',
      userId: 'user-456',
      provider: 'search_console',
    })
  })

  it('produces different states each time (random nonce)', () => {
    const a = createOAuthState('org-123', 'user-456')
    const b = createOAuthState('org-123', 'user-456')
    expect(a).not.toBe(b)
  })

  it('returns null for tampered signature', () => {
    const state = createOAuthState('org-123', 'user-456')
    const parts = state.split('.')
    const tampered = `${parts[0]}.${parts[1]}.${parts[2]}.${parts[3]}.tampered-sig`
    expect(validateOAuthState(tampered)).toBeNull()
  })

  it('returns null for tampered org ID', () => {
    const state = createOAuthState('org-123', 'user-456')
    const parts = state.split('.')
    const tampered = `org-evil.${parts[1]}.${parts[2]}.${parts[3]}.${parts[4]}`
    expect(validateOAuthState(tampered)).toBeNull()
  })

  it('returns null for missing parts', () => {
    expect(validateOAuthState('only-one-part')).toBeNull()
    expect(validateOAuthState('two.parts')).toBeNull()
    expect(validateOAuthState('three.parts.here')).toBeNull()
    expect(validateOAuthState('four.parts.here.now')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(validateOAuthState('')).toBeNull()
  })
})
