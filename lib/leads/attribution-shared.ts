// Lead attribution — how a visitor found the site. This module has no Zod
// import so browser code (attribution capture, phone-click beacons, the
// estimate form) stays light; Zod schemas for the API live in ./attribution.
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

export type Attribution = {
  landing_page?: string
  referrer_host?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  gclid?: boolean
  first_seen_at?: string
}

// Max lengths, shared with the Zod schema in ./attribution.
export const ATTRIBUTION_LIMITS = {
  landing_page: 300,
  referrer_host: 200,
  utm_source: 200,
  utm_medium: 200,
  utm_campaign: 200,
  utm_term: 200,
  utm_content: 200,
  first_seen_at: 40,
} as const

type AttributionTextKey = keyof typeof ATTRIBUTION_LIMITS

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
const AI_ASSISTANT_HOSTS = [
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

// Keep only known fields, with the right types and lengths. Used to rebuild a
// record read back from browser storage (the API re-validates with Zod).
export function sanitizeAttribution(value: unknown): Attribution | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const input = value as Record<string, unknown>
  const out: Attribution = {}
  for (const key of Object.keys(ATTRIBUTION_LIMITS) as AttributionTextKey[]) {
    const v = input[key]
    if (v === undefined) continue
    if (typeof v !== 'string') return undefined
    const text = v.trim()
    if (text.length > ATTRIBUTION_LIMITS[key]) return undefined
    out[key] = text
  }
  if (input.gclid !== undefined) {
    if (typeof input.gclid !== 'boolean') return undefined
    out.gclid = input.gclid
  }
  return out
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

  const utm = (key: AttributionTextKey) =>
    params.get(key)?.trim().slice(0, ATTRIBUTION_LIMITS[key]) || undefined

  const record: Attribution = {
    landing_page: url.pathname.slice(0, ATTRIBUTION_LIMITS.landing_page),
    referrer_host: referrerHost?.slice(0, ATTRIBUTION_LIMITS.referrer_host),
    utm_source: utm('utm_source'),
    utm_medium: utm('utm_medium'),
    utm_campaign: utm('utm_campaign'),
    utm_term: utm('utm_term'),
    utm_content: utm('utm_content'),
    gclid: params.has('gclid') || undefined,
    first_seen_at: (input.now ?? new Date()).toISOString(),
  }
  // Drop undefined keys so the stored record stays compact.
  return Object.fromEntries(
    Object.entries(record).filter(([, v]) => v !== undefined),
  ) as Attribution
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
