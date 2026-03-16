import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Phone } from 'lucide-react'
import { getOrganizationBySlug, getAllPublishedServiceCards } from '@/lib/queries/content'
import { HeroSection } from '@/components/marketing/hero-section'
import { ScrollReveal } from '@/components/marketing/scroll-reveal'
import { JsonLd } from '@/components/marketing/json-ld'
import type { OrgSettings, ServiceCardLink } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cleanestpaintingnj.com'
const ORG_SLUG = 'cleanest-painting'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Painting Services in NJ | Cleanest Painting',
  description:
    'Explore our full range of professional painting services — interior, exterior, cabinet refinishing, deck staining, and more. Free estimates across New Jersey.',
  alternates: { canonical: `${BASE_URL}/services` },
  openGraph: {
    title: 'Painting Services in NJ | Cleanest Painting',
    description:
      'Professional painting services across New Jersey. Interior, exterior, cabinets, decks, and more.',
    type: 'website',
    url: `${BASE_URL}/services`,
  },
  twitter: {
    card: 'summary',
    title: 'Painting Services in NJ | Cleanest Painting',
    description:
      'Professional painting services across New Jersey. Interior, exterior, cabinets, decks, and more.',
  },
}

function getMetaDescription(service: ServiceCardLink): string | null {
  if (!service.content || typeof service.content !== 'object') return null
  const content = service.content as Record<string, unknown>
  if (typeof content.meta_description === 'string') return content.meta_description
  return null
}

export default async function ServicesPage() {
  const org = await getOrganizationBySlug(ORG_SLUG)
  if (!org) return null

  const settings = org.settings as unknown as OrgSettings | null
  const phone = settings?.contact_info?.phone
  const rawEstimateUrl = settings?.estimate_url
  const estimateUrl =
    rawEstimateUrl && /^https?:\/\//i.test(rawEstimateUrl) ? rawEstimateUrl : undefined

  const services = await getAllPublishedServiceCards(org.id)

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Cleanest Painting Services',
    description: 'Professional painting and finishing services in New Jersey',
    numberOfItems: services.length,
    itemListElement: services.map((service, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${BASE_URL}/services/${service.slug}`,
      name: service.title,
    })),
  }

  return (
    <>
      <JsonLd data={[itemListSchema]} />

      <HeroSection
        title="Our Services"
        subtitle="Professional painting and finishing for every part of your home"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Services' }]}
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => {
            const description = getMetaDescription(service)
            return (
              <ScrollReveal key={service.slug} delay={i * 80}>
                <Link
                  href={`/services/${service.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  {/* Image or gradient fallback */}
                  <div className="relative aspect-[16/9] overflow-hidden">
                    {service.hero_image_url ? (
                      <Image
                        src={service.hero_image_url}
                        alt={service.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[#1B2B5B] via-[#1e3a5f] to-[#0f1a35]" />
                    )}
                  </div>

                  <div className="p-5">
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-[var(--color-brand-green)]">
                      {service.title}
                    </h2>
                    {description && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-500">{description}</p>
                    )}
                    <span className="mt-3 inline-flex items-center text-sm font-medium text-[#1B2B5B]">
                      Learn more
                      <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </ScrollReveal>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <ScrollReveal>
          <div className="mt-16 rounded-xl bg-gradient-to-r from-[#1B2B5B] to-[#1e3a5f] px-6 py-10 text-center shadow-lg sm:px-10">
            <p className="text-xl font-semibold text-white sm:text-2xl">
              Ready to transform your home?
            </p>
            <p className="mt-2 text-white/70">
              Get a free estimate for any of our painting services.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {estimateUrl && (
                <a
                  href={estimateUrl}
                  className="inline-flex items-center rounded-lg bg-amber-400 px-6 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-300"
                >
                  Get Your Free Estimate
                </a>
              )}
              {phone && (
                <a
                  href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <Phone className="h-4 w-4" />
                  {phone}
                </a>
              )}
            </div>
          </div>
        </ScrollReveal>
      </section>
    </>
  )
}
