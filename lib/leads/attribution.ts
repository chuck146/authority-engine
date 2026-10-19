import { z } from 'zod'

// Lead attribution — how a visitor found the site. Shared by the browser
// (capture) and the API (validation + classification).
//
// Privacy: we keep only the referrer *hostname*, the landing *path* (no query
// string), UTM parameters, and whether a gclid was present. No names, emails,
// or phone numbers ever go into attribution data or analytics events.

// "How did you hear about us?" — customer-reported discovery source.
export const DISCOVERY_SOURCES = [
  { value: 'google_search', label: 'Google search' },
  { value: 'google_maps', label: 'Google Maps / Business Profile' },
  { value: 'ai_assistant', label: 'ChatGPT or another AI assistant' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'angi', label: 'Angi' },
  { value: 'referral', label: 'Friend, family, or neighbor' },
  { value: 'yard_sign', label: 'Yard sign or truck' },
  { value: 'past_customer', label: 'I’m a past customer' },
  { value: 'other', label: 'Other' },
] as const

export type DiscoverySource = (typeof DISCOVERY_SOURCES)[number]['value']

const DISCOVERY_VALUES = DISCOVERY_SOURCES.map((s) => s.value) as [
  DiscoverySource,
  ...DiscoverySource[],
]
export const discoverySourceSchema = z.enum(DISCOVERY_VALUES)

const shortText = z.string().trim().max(200)

export const attributionSchema = z.object({
  landing_page: z.string().trim().max(300).optional(),
  referrer_host: z.string().trim().max(200).optional(),
  utm_source: shortText.optional(),
  utm_medium: shortText.optional(),
  utm_campaign: shortText.optional(),
  utm_term: shortText.optional(),
  utm_content: shortText.optional(),
  gclid: z.boolean().optional(),
  first_seen_at: z.string().trim().max(40).optional(),
})

export type Attribution = z.infer<typeof attributionSchema>

// Observed traffic channel, classified from referrer + UTM tags.
export type LeadChannel =
  | 'ai_assistant'
  | 'paid_search'
  | 'google_business_profile'
  | 'organic_search'
  | 'social'
  | 'email'
  | 'referral'
  | 'direct'

export const CHANNEL_LABELS: Record<LeadChannel | 'unknown', string> = {
  ai_assistant: 'AI assistant referral',
  paid_search: 'Paid search',
  google_business_profile: 'Google Business Profile',
  organic_search: 'Organic search',
  social: 'Social',
  email: 'Email',
  referral: 'Other website',
  direct: 'Direct / unknown',
  unknown: 'Not tracked (before attribution)',
}

export function discoverySourceLabel(value: string): string {
  return DISCOVERY_SOURCES.find((s) => s.value === value)?.label ?? value
}

// AI assistants that send referral traffic. A visit from these hosts (or tagged
// utm_source, e.g. ChatGPT appends utm_source=chatgpt.com to cited links) is
// counted as an AI-assistant referral. Many AI answers send no referrer at all,
// so this undercounts — compare with the "How did you hear about us?" answer.
export const AI_ASSISTANT_HOSTS = [
  'chatgpt.com',
  'chat.openai.com',
  'perplexity.ai',
  'gemini.google.com',
  'copilot.microsoft.com',
  'claude.ai',
  'meta.ai',
]
const AI_ASSISTANT_SOURCE = /chatgpt|openai|perplexity|gemini|copilot|claude/

const SEARCH_HOSTS = [
  'google.',
  'bing.com',
  'duckduckgo.com',
  'search.yahoo.com',
  'yahoo.com',
  'search.brave.com',
  'ecosia.org',
]

const SOCIAL_HOSTS = [
  'facebook.com',
  'instagram.com',
  'nextdoor.com',
  'linkedin.com',
  'youtube.com',
  'x.com',
  't.co',
  'pinterest.com',
  'tiktok.com',
]

function hostMatches(host: string, candidates: string[]): boolean {
  return candidates.some((c) =>
    c.endsWith('.')
      ? host.startsWith(c) || host.includes(`.${c}`)
      : host === c || host.endsWith(`.${c}`),
  )
}

function normalizeHost(host: string | undefined): string {
  return (host ?? '').toLowerCase().replace(/^www\./, '')
}

export function classifyChannel(a: Attribution | undefined, siteHost?: string): LeadChannel {
  if (!a) return 'direct'

  const host = normalizeHost(a.referrer_host)
  const source = (a.utm_source ?? '').toLowerCase()
  const medium = (a.utm_medium ?? '').toLowerCase()
  const isSelf = !!host && host === normalizeHost(siteHost)

  if (hostMatches(host, AI_ASSISTANT_HOSTS) || AI_ASSISTANT_SOURCE.test(source)) {
    return 'ai_assistant'
  }
  if (a.gclid || ['cpc', 'ppc', 'paid', 'paidsearch', 'paid_search'].includes(medium)) {
    return 'paid_search'
  }
  if (/\b(gbp|gmb|google_business|business_profile)\b/.test(`${source} ${medium}`)) {
    return 'google_business_profile'
  }
  if (host.startsWith('maps.google.') || host === 'business.google.com') {
    return 'google_business_profile'
  }
  if (medium === 'email' || medium === 'newsletter') return 'email'
  if (medium === 'social' || hostMatches(host, SOCIAL_HOSTS)) return 'social'
  if (medium === 'organic' || hostMatches(host, SEARCH_HOSTS)) return 'organic_search'
  if (host && !isSelf) return 'referral'
  if (source) return 'referral'
  return 'direct'
}

// Build an attribution record from the browser's first page view.
export function buildAttribution(input: {
  href: string
  referrer: string
  now?: Date
}): Attribution {
  const url = new URL(input.href)
  const params = url.searchParams

  let referrerHost: string | undefined
  try {
    const ref = input.referrer ? new URL(input.referrer) : null
    if (ref && normalizeHost(ref.hostname) !== normalizeHost(url.hostname)) {
      referrerHost = ref.hostname.toLowerCase()
    }
  } catch {
    referrerHost = undefined
  }

  const utm = (key: string) => params.get(key)?.slice(0, 200) || undefined

  return attributionSchema.parse({
    landing_page: url.pathname.slice(0, 300),
    referrer_host: referrerHost,
    utm_source: utm('utm_source'),
    utm_medium: utm('utm_medium'),
    utm_campaign: utm('utm_campaign'),
    utm_term: utm('utm_term'),
    utm_content: utm('utm_content'),
    gclid: params.has('gclid') || undefined,
    first_seen_at: (input.now ?? new Date()).toISOString(),
  })
}

// Map an observed channel onto the existing leads.source values.
export function leadSourceForChannel(
  channel: LeadChannel,
  attribution: Attribution | undefined,
): 'website' | 'gbp' | 'facebook' {
  if (channel === 'google_business_profile') return 'gbp'
  const host = normalizeHost(attribution?.referrer_host)
  const source = (attribution?.utm_source ?? '').toLowerCase()
  if (channel === 'social' && (host.endsWith('facebook.com') || source.includes('facebook'))) {
    return 'facebook'
  }
  return 'website'
}
