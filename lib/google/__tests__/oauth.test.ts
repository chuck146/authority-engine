import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getGoogleAuthUrl, exchangeCodeForTokens, refreshAccessToken, revokeToken } from '../oauth'

const MOCK_CLIENT_ID = 'test-client-id'
const MOCK_CLIENT_SECRET = 'test-client-secret'
const MOCK_REDIRECT_URI = 'http://localhost:3000/api/auth/google/callback'

beforeEach(() => {
  vi.stubEnv('GOOGLE_OAUTH_CLIENT_ID', MOCK_CLIENT_ID)
  vi.stubEnv('GOOGLE_OAUTH_CLIENT_SECRET', MOCK_CLIENT_SECRET)
  vi.stubEnv('GOOGLE_OAUTH_REDIRECT_URI', MOCK_REDIRECT_URI)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('getGoogleAuthUrl', () => {
  it('builds consent URL with correct params', () => {
    const url = getGoogleAuthUrl('test-state-123')
    const parsed = new URL(url)

    expect(parsed.origin + parsed.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth')
    expect(parsed.searchParams.get('client_id')).toBe(MOCK_CLIENT_ID)
    expect(parsed.searchParams.get('redirect_uri')).toBe(MOCK_REDIRECT_URI)
    expect(parsed.searchParams.get('response_type')).toBe('code')
    expect(parsed.searchParams.get('access_type')).toBe('offline')
    expect(parsed.searchParams.get('prompt')).toBe('consent')
    expect(parsed.searchParams.get('state')).toBe('test-state-123')
    expect(parsed.searchParams.get('scope')).toContain('webmasters.readonly')
  })

  it('throws if client ID not configured', () => {
    vi.stubEnv('GOOGLE_OAUTH_CLIENT_ID', '')
    expect(() => getGoogleAuthUrl('state')).toThrow('GOOGLE_OAUTH_CLIENT_ID not configured')
  })
})

describe('exchangeCodeForTokens', () => {
  it('sends correct POST to Google token endpoint', async () => {
    const mockTokens = {
      access_token: 'ya29.test',
      refresh_token: '1//test',
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    }

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockTokens), { status: 200 }),
    )

    const result = await exchangeCodeForTokens('auth-code-123')

    expect(global.fetch).toHaveBeenCalledOnce()
    const [url, opts] = vi.mocked(global.fetch).mock.calls[0]!
    expect(url).toBe('https://oauth2.googleapis.com/token')
    expect(opts?.method).toBe('POST')

    const body = new URLSearchParams(opts?.body as string)
    expect(body.get('code')).toBe('auth-code-123')
    expect(body.get('grant_type')).toBe('authorization_code')

    expect(result).toEqual(mockTokens)
  })

  it('throws on non-200 response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response('Bad Request', { status: 400 }),
    )

    await expect(exchangeCodeForTokens('bad-code')).rejects.toThrow(
      'Google token exchange failed (400)',
    )
  })
})

describe('refreshAccessToken', () => {
  it('sends refresh request and preserves original refresh token', async () => {
    const mockResponse = {
      access_token: 'ya29.refreshed',
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    }

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    )

    const result = await refreshAccessToken('1//original-refresh')

    expect(result.access_token).toBe('ya29.refreshed')
    expect(result.refresh_token).toBe('1//original-refresh')
  })

  it('uses new refresh token when provided by Google', async () => {
    const mockResponse = {
      access_token: 'ya29.refreshed',
      refresh_token: '1//new-refresh',
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    }

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    )

    const result = await refreshAccessToken('1//old-refresh')
    expect(result.refresh_token).toBe('1//new-refresh')
  })

  it('throws on non-200 response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response('Unauthorized', { status: 401 }),
    )

    await expect(refreshAccessToken('bad-token')).rejects.toThrow(
      'Google token refresh failed (401)',
    )
  })
})

describe('revokeToken', () => {
  it('sends revocation POST', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response('', { status: 200 }))

    await revokeToken('token-to-revoke')

    expect(global.fetch).toHaveBeenCalledOnce()
    const [url] = vi.mocked(global.fetch).mock.calls[0]!
    expect(url).toContain('token=token-to-revoke')
  })

  it('does not throw on non-200 revocation', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response('', { status: 400 }))
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(revokeToken('bad-token')).resolves.toBeUndefined()
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('400'))
  })
})
