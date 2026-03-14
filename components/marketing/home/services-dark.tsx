import Link from 'next/link'
import { ScrollReveal } from '@/components/marketing/scroll-reveal'
import type { RelatedServiceLink } from '@/types'

type ServicesDarkProps = {
  services: RelatedServiceLink[]
}

export function ServicesDark({ services }: ServicesDarkProps) {
  if (services.length === 0) return null

  return (
    <section id="services" className="bg-[var(--color-brand-cream)]">
      <div className="mx-auto max-w-7xl px-6 py-28 md:px-10 lg:px-[60px]">
        <ScrollReveal>
          <h2 className="font-display text-3xl font-semibold text-gray-900 sm:text-4xl lg:text-5xl">
            Our Services
          </h2>
          <p className="mt-3 max-w-lg text-gray-500">
            Professional painting and finishing for every part of your home
          </p>
        </ScrollReveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <ScrollReveal key={service.slug} delay={i * 80}>
              <Link
                href={`/services/${service.slug}`}
                className="group block rounded-xl border border-gray-200 bg-white p-6 transition-colors hover:border-gray-300"
              >
                <h3 className="text-lg font-semibold text-gray-900">{service.title}</h3>
                <span className="mt-4 inline-block text-sm font-medium text-[#1B2B5B]">
                  Learn more
                </span>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
