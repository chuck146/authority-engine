import { z } from 'zod'
import {
  ATTRIBUTION_LIMITS,
  DISCOVERY_SOURCES,
  type Attribution,
  type DiscoverySource,
} from '@/lib/leads/attribution-shared'

// Server-side validation for lead attribution. Browser code should import
// from ./attribution-shared so Zod isn't shipped to every marketing page.
export * from '@/lib/leads/attribution-shared'

const DISCOVERY_VALUES = DISCOVERY_SOURCES.map((s) => s.value) as [
  DiscoverySource,
  ...DiscoverySource[],
]
export const discoverySourceSchema = z.enum(DISCOVERY_VALUES)

const text = (max: number) => z.string().trim().max(max).optional()

export const attributionSchema = z.object({
  landing_page: text(ATTRIBUTION_LIMITS.landing_page),
  referrer_host: text(ATTRIBUTION_LIMITS.referrer_host),
  utm_source: text(ATTRIBUTION_LIMITS.utm_source),
  utm_medium: text(ATTRIBUTION_LIMITS.utm_medium),
  utm_campaign: text(ATTRIBUTION_LIMITS.utm_campaign),
  utm_term: text(ATTRIBUTION_LIMITS.utm_term),
  utm_content: text(ATTRIBUTION_LIMITS.utm_content),
  gclid: z.boolean().optional(),
  first_seen_at: text(ATTRIBUTION_LIMITS.first_seen_at),
}) satisfies z.ZodType<Attribution>
