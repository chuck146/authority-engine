// Browser-only measurement helpers for the marketing site. Every function is a
// no-op when the browser blocks storage or analytics, so the page always works.
//
// Never pass names, emails, phone numbers, or message text to these functions.

import { buildAttribution, attributionSchema, type Attribution } from '@/lib/leads/attribution'

const ATTRIBUTION_KEY = 'ce_attribution'
const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

type StoredAttribution = { savedAt: number; data: Attribution }

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

// First-touch attribution: remember how the visitor first arrived (for 30 days)
// so a lead submitted on a later visit is still credited to the original source.
export function captureAttribution(): void {
  try {
    if (readAttribution()) return
    const data = buildAttribution({ href: window.location.href, referrer: document.referrer })
    const stored: StoredAttribution = { savedAt: Date.now(), data }
    window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(stored))
  } catch {
    // Storage blocked (private mode, disabled cookies) — attribution is optional.
  }
}

export function readAttribution(): Attribution | undefined {
  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_KEY)
    if (!raw) return undefined
    const stored = JSON.parse(raw) as StoredAttribution
    if (!stored?.savedAt || Date.now() - stored.savedAt > ATTRIBUTION_TTL_MS) {
      window.localStorage.removeItem(ATTRIBUTION_KEY)
      return undefined
    }
    const parsed = attributionSchema.safeParse(stored.data)
    return parsed.success ? parsed.data : undefined
  } catch {
    return undefined
  }
}

// GA4 event (only if the GA4 tag is installed and loaded).
export function trackEvent(name: string, params: Record<string, string | undefined>): void {
  try {
    window.gtag?.('event', name, params)
  } catch {
    // ignore
  }
}

// First-party event log (no PII) — survives ad blockers that block GA4.
export function sendMarketingEvent(eventType: 'call_click', linkLocation: string): void {
  try {
    const body = JSON.stringify({
      event_type: eventType,
      page_path: window.location.pathname,
      link_location: linkLocation,
      attribution: readAttribution(),
    })
    const blob = new Blob([body], { type: 'application/json' })
    if (!navigator.sendBeacon?.('/api/v1/events', blob)) {
      void fetch('/api/v1/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    // ignore
  }
}
