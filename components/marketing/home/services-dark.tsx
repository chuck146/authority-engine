import Link from 'next/link'
import { ArrowRight, Paintbrush } from 'lucide-react'
import { ScrollReveal } from '@/components/marketing/scroll-reveal'
import type { RelatedServiceLink } from '@/types'

type ServicesDarkProps = {
  services: RelatedServiceLink[]
}

export function ServicesDark({ services }: ServicesDarkProps) {
  if (services.length === 0) return null

  return (
    <section className="bg-[#1A1A1A]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Crafted <em className="text-[var(--color-brand-green)] not-italic">Services</em>
            </h2>
            <p className="mt-3 text-gray-400">
              Professional painting and finishing for every part of your home
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <ScrollReveal key={service.slug} delay={i * 80}>
              <Link
                href={`/services/${service.slug}`}
                className="group relative block overflow-hidden rounded-xl border border-white/10 bg-[#242424] p-6 transition-all hover:-translate-y-1 hover:border-[var(--color-brand-green)]/40 hover:shadow-[var(--color-brand-green)]/5 hover:shadow-lg"
              >
                {/* Top accent bar on hover */}
                <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-[var(--color-brand-green)] to-[var(--color-brand-green-dark)] transition-transform group-hover:scale-x-100" />

                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-brand-green)] to-[var(--color-brand-green-dark)]">
                  <Paintbrush className="h-5 w-5 text-white" />
                </div>

                <h3 className="text-lg font-semibold text-white">{service.title}</h3>

                <span className="mt-4 inline-flex items-center text-sm font-medium text-[var(--color-brand-green)] transition-colors group-hover:text-[var(--color-brand-yellow)]">
                  Get Quote{' '}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
