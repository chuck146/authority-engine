import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getPublishedServicePage,
  getMarketingOrganization,
  getAllPublishedServiceSlugs,
  getRelatedServicePages,
  getRelatedLocationPages,
  getRelatedBlogPosts,
  getAllPublishedCommercialServiceLinks,
} from '@/lib/queries/content'
import { pickRelatedPosts } from '@/lib/marketing/related'
import { buildServicePageSchemas } from '@/lib/seo/json-ld'
import { ServicePageLayout } from '@/components/marketing/service-page-layout'
import { JsonLd } from '@/components/marketing/json-ld'
import {
  RelatedServices,
  RelatedLocations,
  RelatedBlogPosts,
} from '@/components/marketing/related-links'
import type { StructuredContent } from '@/types/content'
import type { OrgSettings } from '@/types'
import { getEstimateHref } from '@/lib/marketing/estimate'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cleanestpaintingnj.com'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const org = await getMarketingOrganization()
  if (!org) return []
  const slugs = await getAllPublishedServiceSlugs(org.id)
  return slugs.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const org = await getMarketingOrganization()
  const page = org ? await getPublishedServicePage(org.id, slug) : null
  if (!page) return {}

  const content = page.content as unknown as StructuredContent
  const heroUrl = (page as Record<string, unknown>).hero_image_url as string | undefined
  return {
    title: content.meta_title,
    description: content.meta_description,
    alternates: { canonical: `${BASE_URL}/services/${slug}` },
    openGraph: {
      title: content.meta_title,
      description: content.meta_description,
      url: `${BASE_URL}/services/${slug}`,
      type: 'website',
      ...(heroUrl && { images: [{ url: heroUrl }] }),
    },
    twitter: {
      card: heroUrl ? 'summary_large_image' : 'summary',
      title: content.meta_title ?? undefined,
      description: content.meta_description ?? undefined,
      ...(heroUrl && { images: [heroUrl] }),
    },
  }
}

export default async function ServicePageRoute({ params }: Props) {
  const { slug } = await params
  const org = await getMarketingOrganization()
  const page = org ? await getPublishedServicePage(org.id, slug) : null
  if (!org || !page) notFound()

  const isCommercial = page.slug === 'commercial-painting'
  const [relatedServices, relatedLocations, recentPosts, commercialServices] = await Promise.all([
    getRelatedServicePages(page.organization_id, page.slug, 3),
    getRelatedLocationPages(page.organization_id, '', 4),
    getRelatedBlogPosts(page.organization_id, '', 20),
    isCommercial ? getAllPublishedCommercialServiceLinks(page.organization_id) : [],
  ])
  const relatedPosts = pickRelatedPosts(recentPosts, page.slug, 2)

  const settings = org?.settings as OrgSettings | null
  const phone = settings?.contact_info?.phone
  const estimateUrl = getEstimateHref(settings, page.slug)

  return (
    <>
      {org && <JsonLd data={buildServicePageSchemas(page, org)} />}
      <ServicePageLayout page={page} phone={phone} estimateUrl={estimateUrl} />
      <RelatedServices
        services={commercialServices}
        basePath="/commercial"
        heading="Commercial Painting Services"
      />
      <RelatedServices services={relatedServices} />
      <RelatedBlogPosts posts={relatedPosts} />
      <RelatedLocations locations={relatedLocations} heading="We Also Serve" />
    </>
  )
}
