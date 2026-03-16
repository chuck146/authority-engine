import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Phone } from 'lucide-react'
import { getOrganizationBySlug, getAllPublishedBlogCards } from '@/lib/queries/content'
import { HeroSection } from '@/components/marketing/hero-section'
import { ScrollReveal } from '@/components/marketing/scroll-reveal'
import { JsonLd } from '@/components/marketing/json-ld'
import type { OrgSettings, BlogCardLink } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cleanestpaintingnj.com'
const ORG_SLUG = 'cleanest-painting'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Painting Tips & Guides | Cleanest Painting Blog',
  description:
    'Expert painting tips, project inspiration, and home improvement guides from Cleanest Painting LLC. Learn about colors, techniques, and seasonal maintenance.',
  alternates: { canonical: `${BASE_URL}/blog` },
  openGraph: {
    title: 'Painting Tips & Guides | Cleanest Painting Blog',
    description:
      'Expert painting tips, project inspiration, and home improvement guides from Cleanest Painting.',
    type: 'website',
    url: `${BASE_URL}/blog`,
  },
  twitter: {
    card: 'summary',
    title: 'Painting Tips & Guides | Cleanest Painting Blog',
    description:
      'Expert painting tips, project inspiration, and home improvement guides from Cleanest Painting.',
  },
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return null
  }
}

function BlogCard({ post, index }: { post: BlogCardLink; index: number }) {
  const date = formatDate(post.published_at)

  return (
    <ScrollReveal delay={index * 80}>
      <Link
        href={`/blog/${post.slug}`}
        className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        {/* Image or gradient fallback */}
        <div className="relative aspect-[16/9] overflow-hidden">
          {post.featured_image_url ? (
            <Image
              src={post.featured_image_url}
              alt={post.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#1B2B5B] via-[#1e3a5f] to-[#0f1a35]" />
          )}
        </div>

        <div className="p-5">
          {date && <p className="mb-2 text-xs font-medium text-gray-400">{date}</p>}
          <h2 className="text-lg font-semibold text-gray-900 group-hover:text-[var(--color-brand-green)]">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="mt-2 line-clamp-2 text-sm text-gray-500">{post.excerpt}</p>
          )}
          <span className="mt-3 inline-flex items-center text-sm font-medium text-[#1B2B5B]">
            Read more
            <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </ScrollReveal>
  )
}

export default async function BlogPage() {
  const org = await getOrganizationBySlug(ORG_SLUG)
  if (!org) return null

  const settings = org.settings as unknown as OrgSettings | null
  const phone = settings?.contact_info?.phone
  const rawEstimateUrl = settings?.estimate_url
  const estimateUrl =
    rawEstimateUrl && /^https?:\/\//i.test(rawEstimateUrl) ? rawEstimateUrl : undefined

  const posts = await getAllPublishedBlogCards(org.id)

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Cleanest Painting Blog',
    description: 'Painting tips, guides, and project inspiration',
    numberOfItems: posts.length,
    itemListElement: posts.map((post, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${BASE_URL}/blog/${post.slug}`,
      name: post.title,
    })),
  }

  const [featured, ...rest] = posts

  return (
    <>
      <JsonLd data={[itemListSchema]} />

      <HeroSection
        title="Blog"
        subtitle="Tips, guides, and inspiration for your next painting project"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Blog' }]}
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Featured post — full width */}
        {featured && (
          <ScrollReveal>
            <Link
              href={`/blog/${featured.slug}`}
              className="group mb-10 block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md md:flex"
            >
              <div className="relative aspect-[16/9] overflow-hidden md:aspect-auto md:w-1/2">
                {featured.featured_image_url ? (
                  <Image
                    src={featured.featured_image_url}
                    alt={featured.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="h-full min-h-[200px] w-full bg-gradient-to-br from-[#1B2B5B] via-[#1e3a5f] to-[#0f1a35]" />
                )}
              </div>
              <div className="flex flex-col justify-center p-6 md:w-1/2 md:p-8">
                {featured.published_at && (
                  <p className="mb-2 text-xs font-medium text-gray-400">
                    {formatDate(featured.published_at)}
                  </p>
                )}
                <h2 className="text-xl font-semibold text-gray-900 group-hover:text-[var(--color-brand-green)] sm:text-2xl">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="mt-3 line-clamp-3 text-gray-500">{featured.excerpt}</p>
                )}
                <span className="mt-4 inline-flex items-center text-sm font-medium text-[#1B2B5B]">
                  Read more
                  <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </ScrollReveal>
        )}

        {/* Remaining posts grid */}
        {rest.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post, i) => (
              <BlogCard key={post.slug} post={post} index={i} />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <ScrollReveal>
          <div className="mt-16 rounded-xl bg-gradient-to-r from-[#1B2B5B] to-[#1e3a5f] px-6 py-10 text-center shadow-lg sm:px-10">
            <p className="text-xl font-semibold text-white sm:text-2xl">
              Have a painting project in mind?
            </p>
            <p className="mt-2 text-white/70">
              Get a free estimate — we&apos;d love to help bring your vision to life.
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
