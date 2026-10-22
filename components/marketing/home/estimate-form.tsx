'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Phone } from 'lucide-react'
import { DISCOVERY_SOURCES } from '@/lib/leads/attribution-shared'
import { readAttribution, trackEvent } from '@/lib/analytics/client'
import { TrackedPhoneLink } from '@/components/marketing/tracked-phone-link'

type EstimateFormProps = {
  orgSlug: string
  services: { title: string; slug: string }[]
  phone?: string | null
  // Where the form is rendered — sent with the GA4 generate_lead event
  formLocation?: 'homepage' | 'estimate_page'
  headingAs?: 'h1' | 'h2'
  title?: string
  intro?: string
}

export function EstimateForm({
  orgSlug,
  services,
  phone,
  formLocation = 'homepage',
  headingAs: Heading = 'h2',
  title = 'Get Your Free Estimate',
  intro = 'Tell us about your project. We’ll get back to you within 24 hours.',
}: EstimateFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [serviceSlug, setServiceSlug] = useState('')

  // Preselect the service when arriving from a service page (/estimate?service=slug).
  useEffect(() => {
    try {
      const requested = new URLSearchParams(window.location.search).get('service')
      if (requested && services.some((s) => s.slug === requested)) setServiceSlug(requested)
    } catch {
      // ignore
    }
  }, [services])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMessage('')

    const form = e.currentTarget
    const data = new FormData(form)
    const selectedService = services.find((s) => s.slug === serviceSlug)
    const discoverySource = (data.get('discovery_source') as string) || undefined

    try {
      const res = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_slug: orgSlug,
          name: data.get('name'),
          email: data.get('email'),
          phone: data.get('phone'),
          service: selectedService?.title,
          message: data.get('message') || undefined,
          sms_consent: data.get('sms_consent') === 'on',
          discovery_source: discoverySource,
          attribution: readAttribution(),
          company_website: data.get('company_website') || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error ?? 'Something went wrong')
      }

      // Count the lead only after the server accepted it. No personal data.
      trackEvent('generate_lead', {
        form_location: formLocation,
        service_slug: selectedService?.slug,
        discovery_source: discoverySource,
      })
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const inputClasses =
    'w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/30'

  if (status === 'success') {
    return (
      <section id="estimate" className="bg-[#1B2B5B]">
        <div className="mx-auto max-w-7xl px-6 py-28 md:px-10 lg:px-[60px]">
          <div className="text-center" role="status">
            <Heading className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Thank you!
            </Heading>
            <p className="mx-auto mt-4 max-w-lg text-lg text-white/70">
              We received your request and will get back to you within 24 hours.
            </p>
            {phone && (
              <p className="mt-6 text-white/50">
                Need something sooner? Call us at{' '}
                <TrackedPhoneLink
                  phone={phone}
                  location="estimate_success"
                  className="font-semibold text-white underline underline-offset-4"
                />
              </p>
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="estimate" className="bg-[#1B2B5B]">
      <div className="mx-auto max-w-7xl px-6 py-28 md:px-10 lg:px-[60px]">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Left: Headline */}
          <div className="lg:col-span-2">
            <Heading className="font-display text-3xl font-semibold text-white sm:text-4xl">
              {title}
            </Heading>
            <p className="mt-4 text-lg text-white/70">{intro}</p>
            {phone && (
              <TrackedPhoneLink
                phone={phone}
                location="estimate_form"
                className="mt-6 inline-flex items-center gap-2 text-white/50 transition-colors hover:text-white/80"
              >
                <Phone className="h-4 w-4" />
                <span>{phone}</span>
              </TrackedPhoneLink>
            )}
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-3">
            {/* method="post": if JS hasn't loaded yet, a native submit must not put
                contact details in the URL (and from there into analytics/logs). */}
            <form method="post" onSubmit={handleSubmit} className="relative space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sr-only" htmlFor={`${formLocation}-name`}>
                  Full name
                </label>
                <input
                  id={`${formLocation}-name`}
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Full name"
                  className={inputClasses}
                />
                <label className="sr-only" htmlFor={`${formLocation}-email`}>
                  Email
                </label>
                <input
                  id={`${formLocation}-email`}
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Email"
                  className={inputClasses}
                />
                <label className="sr-only" htmlFor={`${formLocation}-phone`}>
                  Phone
                </label>
                <input
                  id={`${formLocation}-phone`}
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="Phone"
                  className={inputClasses}
                />
                <label className="sr-only" htmlFor={`${formLocation}-service`}>
                  Service
                </label>
                <select
                  id={`${formLocation}-service`}
                  name="service"
                  value={serviceSlug}
                  onChange={(e) => setServiceSlug(e.target.value)}
                  className={inputClasses}
                >
                  <option value="" disabled className="text-gray-900">
                    Select a service
                  </option>
                  {services.map((s) => (
                    <option key={s.slug} value={s.slug} className="text-gray-900">
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
              <label className="sr-only" htmlFor={`${formLocation}-message`}>
                Project details
              </label>
              <textarea
                id={`${formLocation}-message`}
                name="message"
                rows={4}
                placeholder="Tell us about your project (optional)"
                className={`${inputClasses} resize-none`}
              />
              <div>
                <label
                  htmlFor={`${formLocation}-discovery`}
                  className="mb-1.5 block text-sm text-white/60"
                >
                  How did you hear about us? (optional)
                </label>
                <select
                  id={`${formLocation}-discovery`}
                  name="discovery_source"
                  defaultValue=""
                  className={inputClasses}
                >
                  <option value="" className="text-gray-900">
                    Choose one
                  </option>
                  {DISCOVERY_SOURCES.map((s) => (
                    <option key={s.value} value={s.value} className="text-gray-900">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              {/* Honeypot — hidden from people and assistive tech; bots fill it in. */}
              <div
                aria-hidden="true"
                className="absolute -left-[10000px] h-px w-px overflow-hidden"
              >
                <label htmlFor={`${formLocation}-company-website`}>Company website</label>
                <input
                  id={`${formLocation}-company-website`}
                  name="company_website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  name="sms_consent"
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 rounded border-white/30 bg-white/10 text-amber-400 accent-amber-400"
                />
                <span className="text-sm leading-snug text-white/60">
                  I agree to receive SMS text messages from Cleanest Painting LLC at the phone
                  number provided, including estimate follow-ups, appointment confirmations, and
                  project updates. Message frequency varies (approx. 2–4/month). Msg &amp; data
                  rates may apply. Reply STOP to opt out anytime. Consent is not required to receive
                  a painting estimate.{' '}
                  <a href="/privacy" className="underline underline-offset-2 hover:text-white/80">
                    Privacy Policy
                  </a>{' '}
                  &amp;{' '}
                  <a href="/terms" className="underline underline-offset-2 hover:text-white/80">
                    Terms of Service
                  </a>
                </span>
              </label>
              {status === 'error' && (
                <p role="alert" className="text-sm text-red-300">
                  {errorMessage}
                </p>
              )}
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full rounded-lg bg-white px-8 py-3.5 text-sm font-bold text-[#1B2B5B] transition-colors hover:bg-gray-100 disabled:opacity-50 sm:w-auto"
              >
                {status === 'submitting' ? 'Submitting...' : 'Request Free Estimate'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
