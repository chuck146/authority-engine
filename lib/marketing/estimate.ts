import type { OrgSettings } from '@/types'

const CANONICAL_HOST = 'cleanestpaintingnj.com'

function normalizeHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, '')
}

// Where "Get a Free Estimate" buttons point. An external booking/estimate tool
// configured in settings.estimate_url is respected; anything on our own domain
// (including the legacy "/#estimate" homepage anchor) goes to the dedicated
// /estimate page, optionally preselecting the service the visitor was reading about.
export function getEstimateHref(
  settings: OrgSettings | null | undefined,
  serviceSlug?: string,
): string {
  const raw = settings?.estimate_url?.trim()
  if (raw && /^https?:\/\//i.test(raw)) {
    try {
      const host = normalizeHost(new URL(raw).hostname)
      const siteHost = normalizeHost(
        new URL(process.env.NEXT_PUBLIC_SITE_URL ?? `https://${CANONICAL_HOST}`).hostname,
      )
      if (host !== siteHost && host !== CANONICAL_HOST) return raw
    } catch {
      // fall through to the on-site page
    }
  }
  return serviceSlug ? `/estimate?service=${encodeURIComponent(serviceSlug)}` : '/estimate'
}
