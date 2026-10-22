import { describe, it, expect } from 'vitest'
import robots, { DISALLOWED_PATHS, SEARCH_AGENTS } from '@/app/robots'

describe('robots.txt', () => {
  const result = robots()
  const rules = Array.isArray(result.rules) ? result.rules : [result.rules]

  it('disallows private app paths without trailing slashes so /dashboard itself matches', () => {
    for (const path of ['/dashboard', '/settings', '/login', '/leads', '/calendar', '/api']) {
      expect(DISALLOWED_PATHS).toContain(path)
    }
    expect(DISALLOWED_PATHS).not.toContain('/dashboard/')
  })

  it('never disallows public marketing paths', () => {
    for (const publicPath of ['/services', '/locations', '/blog', '/commercial', '/estimate']) {
      const blocked = DISALLOWED_PATHS.some((p) => publicPath.startsWith(p))
      expect(blocked, publicPath).toBe(false)
    }
  })

  it('gives named search agents the same disallow list as "*"', () => {
    const star = rules.find((r) => r.userAgent === '*')
    const named = rules.find((r) => Array.isArray(r.userAgent))
    expect(star?.disallow).toEqual(DISALLOWED_PATHS)
    expect(named?.userAgent).toEqual(SEARCH_AGENTS)
    expect(named?.disallow).toEqual(DISALLOWED_PATHS)
    expect(named?.allow).toBe('/')
  })

  it('distinguishes search crawlers from training crawlers', () => {
    expect(SEARCH_AGENTS).toContain('OAI-SearchBot')
    expect(SEARCH_AGENTS).not.toContain('GPTBot')
    expect(SEARCH_AGENTS).not.toContain('Google-Extended')
    expect(SEARCH_AGENTS).not.toContain('ClaudeBot')
  })

  it('points to the sitemap', () => {
    expect(result.sitemap).toMatch(/\/sitemap\.xml$/)
  })
})
