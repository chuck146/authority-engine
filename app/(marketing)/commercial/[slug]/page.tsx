import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getPublishedCommercialServicePage,
  getOrganizationById,
  getRelatedLocationPages,
} from '@/lib/queries/content'
import { buildCommercialServicePageSchemas } from '@/lib/seo/json-ld'
import { ServicePageLayout } from '@/components/marketing/service-page-layout'
import { JsonLd } from '@/components/marketing/json-ld'
import { RelatedLocations } from '@/components/marketing/related-links'
import type { StructuredContent } from '@/types/content'
import type { OrgSettings } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cleanestpaintingnj.com'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await getPublishedCommercialServicePage(slug)
  if (!page) return {}

  const content = page.content as unknown as StructuredContent
  const heroUrl = page.hero_image_url
  return {
    title: content.meta_title,
    description: content.meta_description,
    alternates: { canonical: `${BASE_URL}/commercial/${slug}` },
    openGraph: {
      title: content.meta_title,
      description: content.meta_description,
      url: `${BASE_URL}/commercial/${slug}`,
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

export default async function CommercialServicePageRoute({ params }: Props) {
  const { slug } = await params
  const page = await getPublishedCommercialServicePage(slug)
  if (!page) notFound()

  const [org, relatedLocations] = await Promise.all([
    getOrganizationById(page.organization_id),
    getRelatedLocationPages(page.organization_id, '', 4),
  ])

  const settings = org?.settings as OrgSettings | null
  const phone = settings?.contact_info?.phone
  const rawEstimateUrl = settings?.estimate_url
  const estimateUrl =
    rawEstimateUrl && /^https?:\/\//i.test(rawEstimateUrl) ? rawEstimateUrl : undefined

  return (
    <>
      {org && <JsonLd data={buildCommercialServicePageSchemas(page, org)} />}
      <ServicePageLayout
        page={page}
        phone={phone}
        estimateUrl={estimateUrl}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Commercial Services', href: '/commercial' },
          { label: page.title },
        ]}
      />
      <RelatedLocations locations={relatedLocations} heading="We Also Serve" />
    </>
  )
}
