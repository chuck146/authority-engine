import { TrackedPhoneLink } from '@/components/marketing/tracked-phone-link'
import type { Metadata } from 'next'
import { MapPin, Phone } from 'lucide-react'
import { getMarketingOrganization, getAllPublishedLocationLinks } from '@/lib/queries/content'
import { getServedCounties } from '@/lib/data/nj-towns'
import { HeroSection } from '@/components/marketing/hero-section'
import { LocationHubClient } from '@/components/marketing/locations/location-hub-client'
import { ScrollReveal } from '@/components/marketing/scroll-reveal'
import { JsonLd } from '@/components/marketing/json-ld'
import type { OrgSettings } from '@/types'
import { getEstimateHref } from '@/lib/marketing/estimate'
import { getBusinessProfile, formatServiceArea } from '@/lib/seo/business'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cleanestpaintingnj.com'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Service Areas — North & Central New Jersey',
  description:
    'Painters serving Union, Essex, Morris, Somerset, Middlesex, Hudson, Monmouth and Bergen counties, NJ. Find your town and request a free estimate.',
  alternates: { canonical: `${BASE_URL}/locations` },
  openGraph: {
    title: 'Service Areas — North & Central New Jersey',
    description:
      'Professional painting across eight North and Central New Jersey counties. Find your town and get a free estimate.',
    type: 'website',
    url: `${BASE_URL}/locations`,
  },
  twitter: {
    card: 'summary',
    title: 'Service Areas — North & Central New Jersey',
    description:
      'Professional painting across eight North and Central New Jersey counties. Find your town and get a free estimate.',
  },
}

export default async function LocationsPage() {
  const org = await getMarketingOrganization()
  if (!org) return null

  const settings = org.settings as unknown as OrgSettings | null
  const phone = settings?.contact_info?.phone
  const estimateUrl = getEstimateHref(settings)
  const profile = getBusinessProfile(org)
  const serviceArea = formatServiceArea(profile) ?? 'New Jersey'

  const publishedLocations = await getAllPublishedLocationLinks(org.id)

  // Build a lookup set of published location slugs (city-based matching)
  const publishedByCity = new Map<string, string>()
  for (const loc of publishedLocations) {
    // Map city name (lowercase) to the actual page slug
    publishedByCity.set(loc.city.toLowerCase(), loc.slug)
  }

  // Merge static NJ data with published pages, limited to the counties in settings
  const counties = getServedCounties(profile.serviceAreaCounties).map((county) => ({
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

  const totalTowns = counties.reduce((sum, c) => sum + c.towns.length, 0)
  const publishedCount = publishedLocations.length

  // JSON-LD ItemList for SEO
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Cleanest Painting Service Areas',
    description: `Professional painting services across ${serviceArea}, New Jersey`,
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
        subtitle={`Proudly serving ${totalTowns}+ communities across ${serviceArea}`}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Service Areas' }]}
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Intro message */}
        <ScrollReveal>
          <div className="mb-12 rounded-xl border border-amber-200 bg-amber-50 px-6 py-5 text-center">
            <p className="text-lg font-medium text-gray-900">We serve {serviceArea}</p>
            <p className="mt-1 text-sm text-gray-600">
              Towns with a{' '}
              <MapPin className="inline-block h-3.5 w-3.5 text-[var(--color-brand-green)]" /> green
              pin have a dedicated page. We serve every town listed below, and take projects
              elsewhere in New Jersey too.
            </p>
          </div>
        </ScrollReveal>

        <LocationHubClient counties={counties} totalTowns={totalTowns} />

        {/* Bottom CTA */}
        <ScrollReveal>
          <div className="mt-16 rounded-xl bg-gradient-to-r from-[#1B2B5B] to-[#1e3a5f] px-6 py-10 text-center shadow-lg sm:px-10">
            <p className="text-xl font-semibold text-white sm:text-2xl">Outside these counties?</p>
            <p className="mt-2 text-white/70">
              We take projects elsewhere in New Jersey too. Call or request a free estimate.
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
                <TrackedPhoneLink
                  phone={phone}
                  location="locations_hub"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <Phone className="h-4 w-4" />
                  {phone}
                </TrackedPhoneLink>
              )}
            </div>
          </div>
        </ScrollReveal>
      </section>
    </>
  )
}
