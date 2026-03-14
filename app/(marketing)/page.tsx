import type { Metadata } from 'next'
import { getOrganizationBySlug, getAllPublishedServiceLinks } from '@/lib/queries/content'
import { JsonLd } from '@/components/marketing/json-ld'
import { HeroSplit } from '@/components/marketing/home/hero-split'
import { ProjectGallery } from '@/components/marketing/home/project-gallery'
import { ServicesDark } from '@/components/marketing/home/services-dark'
import { Testimonials } from '@/components/marketing/home/testimonials'
import { EstimateForm } from '@/components/marketing/home/estimate-form'
import type { OrgBranding, OrgSettings } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cleanestpaintingnj.com'
const ORG_SLUG = 'cleanest-painting'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Cleanest Painting LLC — Professional Painting Services in NJ',
  description:
    'Premium residential and commercial painting services in New Jersey. Interior painting, exterior painting, cabinet refinishing, deck staining, and more. Free estimates.',
  alternates: { canonical: BASE_URL },
  openGraph: {
    title: 'Cleanest Painting LLC — Professional Painting Services in NJ',
    description:
      'Premium residential and commercial painting services in New Jersey. Free estimates.',
    type: 'website',
    url: BASE_URL,
  },
}

export default async function HomePage() {
  const org = await getOrganizationBySlug(ORG_SLUG)
  if (!org) return null

  const services = await getAllPublishedServiceLinks(org.id)

  const branding = org.branding as unknown as OrgBranding | null
  const settings = org.settings as unknown as OrgSettings | null
  const phone = settings?.contact_info?.phone
  const rawEstimateUrl = settings?.estimate_url
  const estimateUrl =
    rawEstimateUrl && /^https?:\/\//i.test(rawEstimateUrl) ? rawEstimateUrl : undefined
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

      {/* 1. Hero — full-bleed project image, copy over gradient */}
      <HeroSplit
        orgName={org.name}
        estimateUrl={estimateUrl}
        phone={phone}
        heroVideo="/hero-video.mov"
      />

      {/* 2. Project Gallery — visual centerpiece */}
      <ProjectGallery
        projects={[
          {
            src: '/project-1.jpeg',
            alt: 'Exterior painting of a brick colonial home with green shutters and white trim',
            label: 'Exterior Painting',
          },
          {
            src: '/project-2.jpeg',
            alt: 'Interior painting of a vaulted ceiling room with green walls, crown molding, and chandelier',
            label: 'Interior Painting',
          },
          {
            src: '/project-3.jpeg',
            alt: 'Interior painting with vibrant yellow accent walls and crisp white trim',
            label: 'Interior Painting',
          },
          {
            src: '/project-4.jpeg',
            alt: 'Luxury home theater room with deep navy blue painted walls, raised panel molding, and moody ambient lighting',
            label: 'Specialty Painting',
          },
        ]}
      />

      {/* 3. Services — cream bg, clean white cards */}
      <ServicesDark services={services} />

      {/* 4. Testimonials — featured review + supporting */}
      <Testimonials />

      {/* 5. Estimate Form — navy, inline lead capture */}
      <EstimateForm organizationId={org.id} services={services} phone={phone} />
    </>
  )
}
