import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const { trackEvent, sendMarketingEvent } = vi.hoisted(() => ({
  trackEvent: vi.fn(),
  sendMarketingEvent: vi.fn(),
}))

vi.mock('@/lib/analytics/client', () => ({ trackEvent, sendMarketingEvent }))

import { TrackedPhoneLink } from '@/components/marketing/tracked-phone-link'

describe('TrackedPhoneLink', () => {
  beforeEach(() => {
    trackEvent.mockClear()
    sendMarketingEvent.mockClear()
  })

  it('builds a tel: href from the phone and shows it by default', () => {
    render(<TrackedPhoneLink phone="(732) 913-8574" location="header" />)
    const link = screen.getByRole('link', { name: '(732) 913-8574' })
    expect(link).toHaveAttribute('href', 'tel:7329138574')
  })

  it('renders children and aria-label when provided', () => {
    render(
      <TrackedPhoneLink phone="+1 732-913-8574" location="footer" ariaLabel="Call us">
        Call now
      </TrackedPhoneLink>,
    )
    const link = screen.getByRole('link', { name: 'Call us' })
    expect(link).toHaveAttribute('href', 'tel:+17329138574')
    expect(link).toHaveTextContent('Call now')
  })

  it('does not fire events on render', () => {
    render(<TrackedPhoneLink phone="(732) 913-8574" location="header" />)
    expect(trackEvent).not.toHaveBeenCalled()
    expect(sendMarketingEvent).not.toHaveBeenCalled()
  })

  it('tracks a call click without the phone number', () => {
    render(<TrackedPhoneLink phone="(732) 913-8574" location="service_cta" />)
    // jsdom cannot navigate to tel: links
    document.addEventListener('click', (e) => e.preventDefault(), { once: true })
    fireEvent.click(screen.getByRole('link'))

    expect(trackEvent).toHaveBeenCalledWith('call_click', { link_location: 'service_cta' })
    expect(sendMarketingEvent).toHaveBeenCalledWith('call_click', 'service_cta')
    const all = JSON.stringify([trackEvent.mock.calls, sendMarketingEvent.mock.calls])
    expect(all).not.toMatch(/732|913|8574/)
  })
})
