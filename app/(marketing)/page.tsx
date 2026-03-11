import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MapPin, Phone, Star, Shield, Clock, Paintbrush } from 'lucide-react'
import {
  getOrganizationBySlug,
  getAllPublishedServiceLinks,
  getAllPublishedLocationLinks,
  getAllPublishedBlogLinks,
} from '@/lib/queries/content'
import { JsonLd } from '@/components/marketing/json-ld'
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

      {/* Hero */}
      <section className="relative flex min-h-[560px] items-center overflow-hidden sm:min-h-[640px]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1B2B5B] via-[#1e3a5f] to-[#0f1a35]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.08),transparent_60%)]" />
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="mb-4 inline-block rounded-full bg-amber-400/90 px-4 py-1.5 text-xs font-semibold tracking-wider text-gray-900 uppercase">
              Northern New Jersey
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {org.name}
            </h1>
            <p className="mt-4 text-xl text-amber-200/90 italic">{tagline}</p>
            <p className="mt-4 text-lg leading-relaxed text-white/80">
              Premium residential painting services across Union, Essex, Morris &amp; Somerset
              counties. From interior transformations to full exterior makeovers — we deliver
              craftsmanship you can see and feel.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              {estimateUrl && (
                <a
                  href={estimateUrl}
                  className="inline-flex items-center justify-center rounded-lg bg-amber-400 px-8 py-3.5 text-sm font-bold text-gray-900 transition-colors hover:bg-amber-300"
                >
                  Get Your Free Estimate
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              )}
              {phone && (
                <a
                  href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <Phone className="h-4 w-4" />
                  {phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="border-b bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
          {[
            { icon: Star, label: '5-Star Rated', desc: 'Google Reviews' },
            { icon: Shield, label: 'Fully Insured', desc: 'Licensed & Bonded' },
            { icon: Clock, label: 'On-Time', desc: 'Every Project' },
            {
              icon: Paintbrush,
              label: 'Premium Paints',
              desc: 'Benjamin Moore & Sherwin-Williams',
            },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1B2B5B]/10">
                <item.icon className="h-5 w-5 text-[#1B2B5B]" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{item.label}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      {services.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Our Services
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Professional painting and finishing services for every part of your home
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="group flex items-center justify-between rounded-xl border bg-white p-6 shadow-sm transition-all hover:border-[#1B2B5B]/30 hover:shadow-md dark:bg-gray-900"
              >
                <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {service.title}
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-[#1B2B5B]" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-[#1B2B5B] to-[#1e3a5f] px-4 py-14 text-center sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready to Transform Your Home?
          </h2>
          <p className="mt-3 text-white/80">
            Get a free, no-obligation estimate. We&apos;ll walk through your project and provide a
            detailed quote — usually within 24 hours.
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
      </section>

      {/* Service Areas */}
      {locations.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Service Areas
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Proudly serving communities across Northern New Jersey
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {locations.map((location) => (
              <Link
                key={location.slug}
                href={`/locations/${location.slug}`}
                className="group flex items-center gap-2.5 rounded-lg border bg-white p-4 transition-all hover:border-[#1B2B5B]/30 hover:shadow-md dark:bg-gray-900"
              >
                <MapPin className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-amber-500" />
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {location.city}, {location.state}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Blog Posts */}
      {blogPosts.length > 0 && (
        <section className="border-t bg-gray-50 dark:bg-gray-900">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                From Our Blog
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Tips, guides, and inspiration for your next painting project
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {blogPosts.slice(0, 3).map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group rounded-xl border bg-white p-6 shadow-sm transition-all hover:border-[#1B2B5B]/30 hover:shadow-md dark:bg-gray-800"
                >
                  <h3 className="font-semibold text-gray-900 group-hover:text-[#1B2B5B] dark:text-gray-100">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                      {post.excerpt}
                    </p>
                  )}
                  <span className="mt-4 inline-flex items-center text-sm font-medium text-[#1B2B5B] dark:text-amber-400">
                    Read more <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t bg-white px-4 py-12 sm:px-6 dark:bg-gray-950">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              {org.logo_url && (
                <Image src={org.logo_url} alt={org.name} width={48} height={48} className="mb-3" />
              )}
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{org.name}</p>
              <p className="mt-1 text-sm text-gray-500 italic">{tagline}</p>
            </div>

            {/* Contact */}
            <div>
              <h3 className="mb-3 text-sm font-semibold tracking-wider text-gray-500 uppercase">
                Contact
              </h3>
              {phone && (
                <a
                  href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                  className="block text-sm text-gray-700 hover:text-[#1B2B5B] dark:text-gray-300"
                >
                  {phone}
                </a>
              )}
              {settings?.contact_info?.email && (
                <a
                  href={`mailto:${settings.contact_info.email}`}
                  className="mt-1 block text-sm text-gray-700 hover:text-[#1B2B5B] dark:text-gray-300"
                >
                  {settings.contact_info.email}
                </a>
              )}
            </div>

            {/* Services */}
            <div>
              <h3 className="mb-3 text-sm font-semibold tracking-wider text-gray-500 uppercase">
                Services
              </h3>
              <ul className="space-y-1">
                {services.slice(0, 5).map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/services/${s.slug}`}
                      className="text-sm text-gray-700 hover:text-[#1B2B5B] dark:text-gray-300"
                    >
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Locations */}
            <div>
              <h3 className="mb-3 text-sm font-semibold tracking-wider text-gray-500 uppercase">
                Service Areas
              </h3>
              <ul className="space-y-1">
                {locations.slice(0, 5).map((l) => (
                  <li key={l.slug}>
                    <Link
                      href={`/locations/${l.slug}`}
                      className="text-sm text-gray-700 hover:text-[#1B2B5B] dark:text-gray-300"
                    >
                      {l.city}, {l.state}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t pt-6 text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} {org.name}. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  )
}
