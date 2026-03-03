import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthError, requireApiAuth, requireApiRole } from '../api-guard'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

const mockSupabase = createMockSupabaseClient()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

beforeEach(() => {
  vi.clearAllMocks()
  // Re-wire chain after clearAllMocks
  mockSupabase.from.mockReturnValue(mockSupabase)
  mockSupabase.select.mockReturnValue(mockSupabase)
  mockSupabase.eq.mockReturnValue(mockSupabase)
  mockSupabase.returns.mockReturnValue(mockSupabase)
})

describe('AuthError', () => {
  it('has name AuthError', () => {
    const err = new AuthError('test')
    expect(err.name).toBe('AuthError')
  })

  it('defaults statusCode to 401', () => {
    const err = new AuthError('unauthorized')
    expect(err.statusCode).toBe(401)
  })

  it('accepts custom statusCode', () => {
    const err = new AuthError('forbidden', 403)
    expect(err.statusCode).toBe(403)
  })

  it('is an instance of Error', () => {
    const err = new AuthError('test')
    expect(err).toBeInstanceOf(Error)
  })
})

describe('requireApiAuth', () => {
  it('returns AuthContext for valid user with membership', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    })
    mockSupabase.single.mockResolvedValueOnce({
      data: { organization_id: 'org-456', role: 'editor' },
      error: null,
    })

    const result = await requireApiAuth()
    expect(result).toEqual({
      userId: 'user-123',
      organizationId: 'org-456',
      role: 'editor',
    })
  })

  it('throws 401 when no user', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    })

    try {
      await requireApiAuth()
      expect.fail('Should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError)
      expect((err as AuthError).message).toBe('Unauthorized')
      expect((err as AuthError).statusCode).toBe(401)
    }
  })

  it('throws 401 when auth error', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('bad token'),
    })

    try {
      await requireApiAuth()
      expect.fail('Should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError)
      expect((err as AuthError).statusCode).toBe(401)
    }
  })

  it('throws 403 when no organization membership', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    })
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    try {
      await requireApiAuth()
      expect.fail('Should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError)
      expect((err as AuthError).statusCode).toBe(403)
    }
  })

  it('defaults null role to viewer', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    })
    mockSupabase.single.mockResolvedValueOnce({
      data: { organization_id: 'org-456', role: null },
      error: null,
    })

    const result = await requireApiAuth()
    expect(result.role).toBe('viewer')
  })
})

describe('requireApiRole', () => {
  function setupAuth(role: string) {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    })
    mockSupabase.single.mockResolvedValueOnce({
      data: { organization_id: 'org-456', role },
      error: null,
    })
  }

  it('passes when user meets minimum role', async () => {
    setupAuth('editor')
    const result = await requireApiRole('editor')
    expect(result.role).toBe('editor')
  })

  it('passes when user exceeds minimum role', async () => {
    setupAuth('owner')
    const result = await requireApiRole('editor')
    expect(result.role).toBe('owner')
  })

  it('throws 403 when user below minimum role', async () => {
    setupAuth('viewer')
    try {
      await requireApiRole('editor')
      expect.fail('Should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError)
      expect((err as AuthError).statusCode).toBe(403)
      expect((err as AuthError).message).toBe('Insufficient permissions')
    }
  })

  it('enforces full hierarchy: viewer < editor < admin < owner', async () => {
    // viewer cannot access admin
    setupAuth('viewer')
    await expect(requireApiRole('admin')).rejects.toThrow('Insufficient permissions')

    // editor cannot access admin
    setupAuth('editor')
    await expect(requireApiRole('admin')).rejects.toThrow('Insufficient permissions')

    // admin can access admin
    setupAuth('admin')
    const result = await requireApiRole('admin')
    expect(result.role).toBe('admin')
  })
})
