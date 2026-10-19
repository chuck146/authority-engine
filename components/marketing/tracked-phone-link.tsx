'use client'

import type { ReactNode } from 'react'
import { telHref } from '@/lib/seo/business'
import { sendMarketingEvent, trackEvent } from '@/lib/analytics/client'

type TrackedPhoneLinkProps = {
  phone: string
  // Where on the page the link sits, e.g. "header", "footer", "service_cta"
  location: string
  className?: string
  ariaLabel?: string
  children?: ReactNode
}

// tel: link that records a call click (GA4 + first-party log). The phone
// number itself is never sent with the event.
export function TrackedPhoneLink({
  phone,
  location,
  className,
  ariaLabel,
  children,
}: TrackedPhoneLinkProps) {
  return (
    <a
      href={telHref(phone)}
      className={className}
      aria-label={ariaLabel}
      onClick={() => {
        trackEvent('call_click', { link_location: location })
        sendMarketingEvent('call_click', location)
      }}
    >
      {children ?? phone}
    </a>
  )
}
