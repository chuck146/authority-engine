import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { ScrollReveal } from '@/components/marketing/scroll-reveal'
import type { RelatedLocationLink } from '@/types'

type ServiceAreasProps = {
  locations: RelatedLocationLink[]
}

export function ServiceAreas({ locations }: ServiceAreasProps) {
  if (locations.length === 0) return null

  return (
    <section className="bg-[var(--color-brand-cream)]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-semibold text-gray-900 sm:text-4xl">
              Service <em className="text-[var(--color-brand-green)] not-italic">Areas</em>
            </h2>
            <p className="mt-3 text-gray-500">
              Proudly serving communities across Northern New Jersey
            </p>
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
      </div>
    </section>
  )
}
