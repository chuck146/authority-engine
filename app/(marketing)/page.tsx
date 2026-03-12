import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import {
  getOrganizationBySlug,
  getAllPublishedServiceLinks,
  getAllPublishedLocationLinks,
  getAllPublishedBlogLinks,
} from '@/lib/queries/content'
import { JsonLd } from '@/components/marketing/json-ld'
import { ScrollReveal } from '@/components/marketing/scroll-reveal'
import { HeroSplit } from '@/components/marketing/home/hero-split'
import { TrustBar } from '@/components/marketing/home/trust-bar'
import { AboutSection } from '@/components/marketing/home/about-section'
import { ServicesDark } from '@/components/marketing/home/services-dark'
import { CtaBanner } from '@/components/marketing/home/cta-banner'
import { Testimonials } from '@/components/marketing/home/testimonials'
import { ServiceAreas } from '@/components/marketing/home/service-areas'
import type { OrgBranding, OrgSettings } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cleanestpaintingnj.com'
const ORG_SLUG = 'cleanest-painting'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Cleanest Painting LLC — Professional Painting Services in NJ',
  description:
    'Premium residential and commercial painting services in Northern New Jersey. Interior painting, exterior painting, cabinet refinishing, deck staining, and more. Free estimates.',
  alternates: { canonical: BASE_URL },
  openGraph: {
    title: 'Cleanest Painting LLC — Professional Painting Services in NJ',
    description:
      'Premium residential and commercial painting services in Northern New Jersey. Free estimates.',
    type: 'website',
    url: BASE_URL,
  },
}

export default async function HomePage() {
  const org = await getOrganizationBySlug(ORG_SLUG)
  if (!org) return null

  const [services, locations, blogPosts] = await Promise.all([
    getAllPublishedServiceLinks(org.id),
    getAllPublishedLocationLinks(org.id),
    getAllPublishedBlogLinks(org.id),
  ])

  const branding = org.branding as unknown as OrgBranding | null
  const settings = org.settings as unknown as OrgSettings | null
  const phone = settings?.contact_info?.phone
  const estimateUrl = settings?.estimate_url
  const tagline = branding?.tagline ?? 'Where Artistry Meets Craftsmanship'

  const businessSchema = {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    name: org.name,
    url: BASE_URL,
    ...(org.logo_url && { logo: org.logo_url }),
    description: tagline,
    ...(phone && { telephone: phone }),
    ...(settings?.contact_info?.email && { email: settings.contact_info.email }),
    ...(settings?.contact_info?.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: settings.contact_info.address.streetAddress,
        addressLocality: settings.contact_info.address.city,
        addressRegion: settings.contact_info.address.state,
        postalCode: settings.contact_info.address.postalCode,
        addressCountry: 'US',
      },
    }),
    ...(settings?.service_area_counties && {
      areaServed: settings.service_area_counties.map((county) => ({
        '@type': 'AdministrativeArea',
        name: `${county} County, ${settings.service_area_states?.[0] ?? 'NJ'}`,
      })),
    }),
  }

  return (
    <>
      <JsonLd data={[businessSchema]} />

      <HeroSplit orgName={org.name} estimateUrl={estimateUrl} phone={phone} />

      <TrustBar />

      <AboutSection />

      <ServicesDark services={services} />

      <CtaBanner estimateUrl={estimateUrl} />

      <ServiceAreas locations={locations} />

      <Testimonials />

      {/* Blog Posts */}
      {blogPosts.length > 0 && (
        <section className="border-t border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="mb-12 text-center">
                <h2 className="font-display text-3xl font-semibold text-gray-900 sm:text-4xl">
                  From Our <em className="text-[var(--color-brand-green)] not-italic">Blog</em>
                </h2>
                <p className="mt-3 text-gray-500">
                  Tips, guides, and inspiration for your next painting project
                </p>
              </div>
            </ScrollReveal>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {blogPosts.slice(0, 3).map((post, i) => (
                <ScrollReveal key={post.slug} delay={i * 100}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="p-6">
                      <h3 className="font-semibold text-gray-900 group-hover:text-[var(--color-brand-green)]">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="mt-2 line-clamp-2 text-sm text-gray-500">{post.excerpt}</p>
                      )}
                      <span className="mt-4 inline-flex items-center text-sm font-medium text-[var(--color-brand-green)]">
                        Read more{' '}
                        <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
