import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/marketing/site'

// Private app + API paths. Robots.txt is NOT access control — these routes are
// protected by middleware/auth guards; disallowing just keeps them out of crawls.
// No trailing slashes: "Disallow: /dashboard/" would not match "/dashboard".
export const DISALLOWED_PATHS = [
  '/api',
  '/auth',
  '/login',
  '/signup',
  '/dashboard',
  '/settings',
  '/content',
  '/calendar',
  '/seo',
  '/social',
  '/reviews',
  '/video',
  '/analytics',
  '/media',
  '/leads',
  '/community',
  // Old WordPress paths — domain was previously WP on SiteGround.
  // Vercel WAF returns 403 for these; disallow prevents GSC indexing errors.
  '/wp-admin',
  '/wp-login.php',
  '/xmlrpc.php',
  '/wp-cron.php',
  '/wp-signup.php',
  '/wp-content/',
  '/wp-includes/',
  '/wp-json/',
]

// Search / answer-engine crawlers we explicitly want on public pages.
// A named group replaces the "*" group for that agent, so each repeats the
// shared disallow list.
//   OAI-SearchBot    — ChatGPT search results (not model training; that's GPTBot)
//   Claude-SearchBot — Claude search results (not model training; that's ClaudeBot)
//   PerplexityBot    — Perplexity search index
// Training crawlers (GPTBot, ClaudeBot, Google-Extended, CCBot) are intentionally
// left on the "*" rules — allowing or blocking them is an owner decision. Blocking
// Google-Extended does not affect Google Search or ranking.
export const SEARCH_AGENTS = [
  'Googlebot',
  'Bingbot',
  'OAI-SearchBot',
  'Claude-SearchBot',
  'PerplexityBot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOWED_PATHS },
      { userAgent: SEARCH_AGENTS, allow: '/', disallow: DISALLOWED_PATHS },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
