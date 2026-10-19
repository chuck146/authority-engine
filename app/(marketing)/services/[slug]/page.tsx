import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getPublishedServicePage,
  getMarketingOrganization,
  getAllPublishedServiceSlugs,
  getRelatedServicePages,
  getRelatedLocationPages,
} from '@/lib/queries/content'
import { buildServicePageSchemas } from '@/lib/seo/json-ld'
import { ServicePageLayout } from '@/components/marketing/service-page-layout'
import { JsonLd } from '@/components/marketing/json-ld'
import { RelatedServices, RelatedLocations } from '@/components/marketing/related-links'
import type { StructuredContent } from '@/types/content'
import type { OrgSettings } from '@/types'

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

  const [relatedServices, relatedLocations] = await Promise.all([
    getRelatedServicePages(page.organization_id, page.slug, 3),
    getRelatedLocationPages(page.organization_id, '', 4),
  ])

  const settings = org?.settings as OrgSettings | null
  const phone = settings?.contact_info?.phone
  const rawEstimateUrl = settings?.estimate_url
  const estimateUrl =
    rawEstimateUrl && /^https?:\/\//i.test(rawEstimateUrl) ? rawEstimateUrl : undefined

  return (
    <>
      {org && <JsonLd data={buildServicePageSchemas(page, org)} />}
      <ServicePageLayout page={page} phone={phone} estimateUrl={estimateUrl} />
      <RelatedServices services={relatedServices} />
      <RelatedLocations locations={relatedLocations} heading="We Also Serve" />
    </>
  )
}
