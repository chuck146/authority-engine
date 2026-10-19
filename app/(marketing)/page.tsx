import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import {
  getMarketingOrganization,
  getAllPublishedServiceLinks,
  getAllPublishedLocationLinks,
  getAllPublishedBlogLinks,
} from '@/lib/queries/content'
import { buildHomePageSchemas } from '@/lib/seo/json-ld'
import { getBusinessProfile, formatServiceArea } from '@/lib/seo/business'
import { MARKETING_ORG_SLUG as ORG_SLUG } from '@/lib/marketing/site'
import { JsonLd } from '@/components/marketing/json-ld'
import { ScrollReveal } from '@/components/marketing/scroll-reveal'
import { HeroSplit } from '@/components/marketing/home/hero-split'
import { TrustBar } from '@/components/marketing/home/trust-bar'
import { AboutSection } from '@/components/marketing/home/about-section'
import { ServicesDark } from '@/components/marketing/home/services-dark'
import { Testimonials } from '@/components/marketing/home/testimonials'
import { ProjectGallery } from '@/components/marketing/home/project-gallery'
import { ServiceAreas } from '@/components/marketing/home/service-areas'
import { EstimateForm } from '@/components/marketing/home/estimate-form'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cleanestpaintingnj.com'

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
  twitter: {
    card: 'summary_large_image',
    title: 'Cleanest Painting LLC — Professional Painting Services in NJ',
    description:
      'Premium residential and commercial painting services in Northern New Jersey. Free estimates.',
  },
}

export default async function HomePage() {
  const org = await getMarketingOrganization()
  if (!org) return null

  const [services, locations, blogPosts] = await Promise.all([
    getAllPublishedServiceLinks(org.id),
    getAllPublishedLocationLinks(org.id),
    getAllPublishedBlogLinks(org.id),
  ])

  const profile = getBusinessProfile(org)
  const phone = profile.phone
  const serviceArea = formatServiceArea(profile)

  return (
    <>
      <JsonLd data={buildHomePageSchemas(org)} />

      <HeroSplit
        orgName={org.name}
        heroVideo="/hero-video.mov"
        location={[profile.locality, profile.region].filter(Boolean).join(', ') || undefined}
        serviceArea={serviceArea}
      />

      <TrustBar />

      <AboutSection />

      <ProjectGallery
        projects={[
          {
            src: '/project-1.jpeg',
            alt: 'Exterior painting of a brick colonial home with green shutters and white trim',
            label: 'Exterior Painting',
          },
          {
            src: '/project-2.jpeg',
            alt: 'Interior painting of a vaulted ceiling living room with scaffolding and recessed lighting',
            label: 'Interior Painting',
          },
          {
            src: '/project-3.jpeg',
            alt: 'Interior painting with vibrant yellow accent walls and crisp white trim',
            label: 'Interior Painting',
          },
          {
            src: '/project-4.jpeg',
            alt: 'Wallpaper installation with floral pattern and custom wainscoting in a powder room',
            label: 'Wallpaper & Wainscoting',
          },
        ]}
      />

      <ServicesDark services={services} />

      <Testimonials />

      <ServiceAreas
        locations={locations}
        phone={phone}
        serviceArea={serviceArea}
        estimateUrl="/#estimate"
      />

      {/* Estimate Form — inline lead capture (replaces CtaBanner) */}
      <EstimateForm orgSlug={ORG_SLUG} services={services} phone={phone} />

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
