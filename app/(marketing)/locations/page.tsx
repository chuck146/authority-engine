import type { Metadata } from 'next'
import { MapPin, Phone } from 'lucide-react'
import { getOrganizationBySlug, getAllPublishedLocationLinks } from '@/lib/queries/content'
import { NJ_SERVICE_COUNTIES, getTotalTownCount } from '@/lib/data/nj-towns'
import { HeroSection } from '@/components/marketing/hero-section'
import { LocationHubClient } from '@/components/marketing/locations/location-hub-client'
import { ScrollReveal } from '@/components/marketing/scroll-reveal'
import { JsonLd } from '@/components/marketing/json-ld'
import type { OrgSettings } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cleanestpaintingnj.com'
const ORG_SLUG = 'cleanest-painting'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Service Areas — Painting Services Across New Jersey | Cleanest Painting',
  description:
    'Cleanest Painting proudly serves communities across New Jersey. Find your town and see our professional painting services available in your area.',
  alternates: { canonical: `${BASE_URL}/locations` },
  openGraph: {
    title: 'Service Areas — Painting Services Across New Jersey',
    description:
      'Professional painting services across New Jersey. Find your town and get a free estimate.',
    type: 'website',
    url: `${BASE_URL}/locations`,
  },
}

export default async function LocationsPage() {
  const org = await getOrganizationBySlug(ORG_SLUG)
  if (!org) return null

  const settings = org.settings as unknown as OrgSettings | null
  const phone = settings?.contact_info?.phone
  const rawEstimateUrl = settings?.estimate_url
  const estimateUrl =
    rawEstimateUrl && /^https?:\/\//i.test(rawEstimateUrl) ? rawEstimateUrl : undefined

  const publishedLocations = await getAllPublishedLocationLinks(org.id)

  // Build a lookup set of published location slugs (city-based matching)
  const publishedByCity = new Map<string, string>()
  for (const loc of publishedLocations) {
    // Map city name (lowercase) to the actual page slug
    publishedByCity.set(loc.city.toLowerCase(), loc.slug)
  }

  // Merge static NJ data with published pages
  const counties = NJ_SERVICE_COUNTIES.map((county) => ({
    county: county.name,
    towns: county.towns.map((town) => {
      const pageSlug = publishedByCity.get(town.name.toLowerCase())
      return {
        name: town.name,
        slug: town.slug,
        hasPage: !!pageSlug,
        pageSlug: pageSlug ?? undefined,
      }
    }),
  }))

  const totalTowns = getTotalTownCount()
  const publishedCount = publishedLocations.length

  // JSON-LD ItemList for SEO
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Cleanest Painting Service Areas',
    description: `Professional painting services across ${counties.length} New Jersey counties`,
    numberOfItems: publishedCount,
    itemListElement: publishedLocations.map((loc, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${BASE_URL}/locations/${loc.slug}`,
      name: `Painting Services in ${loc.city}, ${loc.state}`,
    })),
  }

  return (
    <>
      <JsonLd data={[itemListSchema]} />

      <HeroSection
        title="Service Areas"
        subtitle={`Proudly serving ${totalTowns}+ communities across New Jersey`}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Service Areas' }]}
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Intro message */}
        <ScrollReveal>
          <div className="mb-12 rounded-xl border border-amber-200 bg-amber-50 px-6 py-5 text-center">
            <p className="text-lg font-medium text-gray-900">We service all of New Jersey</p>
            <p className="mt-1 text-sm text-gray-600">
              Towns with a{' '}
              <MapPin className="inline-block h-3.5 w-3.5 text-[var(--color-brand-green)]" /> green
              pin have a dedicated page. All other towns are also serviced — use the search below to
              find yours.
            </p>
          </div>
        </ScrollReveal>

        <LocationHubClient counties={counties} totalTowns={totalTowns} />

        {/* Bottom CTA */}
        <ScrollReveal>
          <div className="mt-16 rounded-xl bg-gradient-to-r from-[#1B2B5B] to-[#1e3a5f] px-6 py-10 text-center shadow-lg sm:px-10">
            <p className="text-xl font-semibold text-white sm:text-2xl">
              Don&apos;t see your town? We likely service your area.
            </p>
            <p className="mt-2 text-white/70">
              Contact us for a free estimate — we serve all of New Jersey.
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
