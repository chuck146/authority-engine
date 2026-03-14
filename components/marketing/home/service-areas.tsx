import Link from 'next/link'
import { ArrowRight, MapPin, Phone } from 'lucide-react'
import { ScrollReveal } from '@/components/marketing/scroll-reveal'
import type { RelatedLocationLink } from '@/types'

type ServiceAreasProps = {
  locations: RelatedLocationLink[]
  phone?: string
  estimateUrl?: string
}

export function ServiceAreas({ locations, phone, estimateUrl }: ServiceAreasProps) {
  if (locations.length === 0) return null

  return (
    <section className="bg-[var(--color-brand-cream)]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-semibold text-gray-900 sm:text-4xl">
              Service <em className="text-[var(--color-brand-green)] not-italic">Areas</em>
            </h2>
            <p className="mt-3 text-gray-500">Proudly serving communities across New Jersey</p>
          </div>
        </ScrollReveal>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {locations.map((loc, i) => (
            <ScrollReveal key={loc.slug} delay={i * 50}>
              <Link
                href={`/locations/${loc.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[var(--color-brand-green)]/30 hover:shadow-md"
              >
                <MapPin className="h-4 w-4 shrink-0 text-gray-400 transition-colors group-hover:text-[var(--color-brand-green)]" />
                <span className="text-sm font-medium text-gray-900">
                  {loc.city}, {loc.state}
                </span>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <div className="mt-8 text-center">
            <Link
              href="/locations"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand-green)] transition-colors hover:text-[var(--color-brand-green)]/80"
            >
              View all service areas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="mt-8 rounded-xl border border-gray-200 bg-white px-6 py-5 text-center">
            <p className="text-sm font-medium text-gray-900">
              Don&apos;t see your town? We service all of New Jersey.
            </p>
            <div className="mt-3 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {estimateUrl && (
                <a
                  href={estimateUrl}
                  className="inline-flex items-center rounded-lg bg-[var(--color-brand-green)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-brand-green)]/90"
                >
                  Get a Free Estimate
                </a>
              )}
              {phone && (
                <a
                  href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {phone}
                </a>
              )}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
