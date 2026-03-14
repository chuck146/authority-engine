'use client'

import { useState, type FormEvent } from 'react'
import { Phone } from 'lucide-react'

type EstimateFormProps = {
  organizationId: string
  services: { title: string; slug: string }[]
  phone?: string | null
}

export function EstimateForm({ organizationId, services, phone }: EstimateFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMessage('')

    const form = e.currentTarget
    const data = new FormData(form)

    try {
      const res = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          name: data.get('name'),
          email: data.get('email'),
          phone: data.get('phone'),
          service: data.get('service') || undefined,
          message: data.get('message') || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error ?? 'Something went wrong')
      }

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
      <section className="bg-[#1B2B5B]">
        <div className="mx-auto max-w-7xl px-6 py-28 md:px-10 lg:px-[60px]">
          <div className="text-center">
            <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Thank you!
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-white/70">
              We received your request and will get back to you within 24 hours.
            </p>
            {phone && (
              <p className="mt-6 text-white/50">
                Need something sooner? Call us at{' '}
                <a
                  href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                  className="font-semibold text-white underline underline-offset-4"
                >
                  {phone}
                </a>
              </p>
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-[#1B2B5B]">
      <div className="mx-auto max-w-7xl px-6 py-28 md:px-10 lg:px-[60px]">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Left: Headline */}
          <div className="lg:col-span-2">
            <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Get Your Free Estimate
            </h2>
            <p className="mt-4 text-lg text-white/70">
              Tell us about your project. We&apos;ll get back to you within 24 hours.
            </p>
            {phone && (
              <a
                href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                className="mt-6 inline-flex items-center gap-2 text-white/50 transition-colors hover:text-white/80"
              >
                <Phone className="h-4 w-4" />
                <span>{phone}</span>
              </a>
            )}
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Full name"
                  className={inputClasses}
                />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="Email"
                  className={inputClasses}
                />
                <input
                  name="phone"
                  type="tel"
                  required
                  placeholder="Phone"
                  className={inputClasses}
                />
                <select name="service" defaultValue="" className={inputClasses}>
                  <option value="" disabled className="text-gray-900">
                    Select a service
                  </option>
                  {services.map((s) => (
                    <option key={s.slug} value={s.title} className="text-gray-900">
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                name="message"
                rows={4}
                placeholder="Tell us about your project (optional)"
                className={`${inputClasses} resize-none`}
              />
              {status === 'error' && <p className="text-sm text-red-300">{errorMessage}</p>}
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
