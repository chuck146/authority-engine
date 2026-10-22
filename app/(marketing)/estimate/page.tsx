import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getMarketingOrganization, getAllPublishedServiceLinks } from '@/lib/queries/content'
import { getBusinessProfile, formatServiceArea } from '@/lib/seo/business'
import { buildBreadcrumbSchema } from '@/lib/seo/json-ld'
import { MARKETING_ORG_SLUG } from '@/lib/marketing/site'
import { EstimateForm } from '@/components/marketing/home/estimate-form'
import { JsonLd } from '@/components/marketing/json-ld'
import { TrackedPhoneLink } from '@/components/marketing/tracked-phone-link'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cleanestpaintingnj.com'

export const revalidate = 3600

const TITLE = 'Request a Free Painting Estimate | Cleanest Painting LLC'
const DESCRIPTION =
  'Request a free painting estimate from Cleanest Painting LLC. Tell us about your interior, exterior, cabinet, or deck project and we’ll get back to you within 24 hours.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/estimate` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/estimate`,
    type: 'website',
  },
  twitter: { card: 'summary', title: TITLE, description: DESCRIPTION },
}

export default async function EstimatePage() {
  const org = await getMarketingOrganization()
  if (!org) notFound()

  const services = await getAllPublishedServiceLinks(org.id)
  const profile = getBusinessProfile(org)
  const serviceArea = formatServiceArea(profile)

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbSchema([
            { label: 'Home', href: '/' },
            { label: 'Free Estimate', href: '/estimate' },
          ]),
        ]}
      />

      <EstimateForm
        orgSlug={MARKETING_ORG_SLUG}
        services={services}
        phone={profile.phone}
        formLocation="estimate_page"
        headingAs="h1"
        title="Request a Free Painting Estimate"
      />

      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-3 md:px-10">
          <div>
            <h2 className="font-display text-2xl font-normal tracking-tight text-gray-900">
              What happens next
            </h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-gray-700">
              <li>Send us a few details about your project.</li>
              <li>We get back to you within 24 hours to talk through the work.</li>
              <li>You receive your free estimate.</li>
            </ol>
          </div>
          <div>
            <h2 className="font-display text-2xl font-normal tracking-tight text-gray-900">
              Prefer to call?
            </h2>
            <p className="mt-4 text-gray-700">
              {profile.phone ? (
                <>
                  Call{' '}
                  <TrackedPhoneLink
                    phone={profile.phone}
                    location="estimate_page"
                    className="font-semibold text-[var(--color-brand-green)] underline underline-offset-4"
                  />{' '}
                  to talk with {profile.name} directly.
                </>
              ) : (
                <>Use the form above and we&apos;ll be in touch.</>
              )}
            </p>
            {serviceArea && (
              <p className="mt-3 text-gray-700">
                We work throughout {serviceArea}.{' '}
                <Link href="/locations" className="underline underline-offset-2">
                  See our service areas
                </Link>
                .
              </p>
            )}
          </div>
          <div>
            <h2 className="font-display text-2xl font-normal tracking-tight text-gray-900">
              Our services
            </h2>
            <ul className="mt-4 space-y-1.5">
              {services.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/services/${s.slug}`}
                    className="text-gray-700 hover:text-[var(--color-brand-green)] hover:underline"
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
