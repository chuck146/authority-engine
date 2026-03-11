import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getPublishedServicePage,
  getOrganizationById,
  getRelatedServicePages,
  getRelatedLocationPages,
} from '@/lib/queries/content'
import { buildServicePageSchemas } from '@/lib/seo/json-ld'
import { ServicePageLayout } from '@/components/marketing/service-page-layout'
import { JsonLd } from '@/components/marketing/json-ld'
import { RelatedServices, RelatedLocations } from '@/components/marketing/related-links'
import type { StructuredContent } from '@/types/content'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cleanestpaintingnj.com'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await getPublishedServicePage(slug)
  if (!page) return {}

  const content = page.content as unknown as StructuredContent
  return {
    title: content.meta_title,
    description: content.meta_description,
    alternates: { canonical: `${BASE_URL}/services/${slug}` },
    openGraph: {
      title: content.meta_title,
      description: content.meta_description,
      type: 'website',
    },
  }
}

export default async function ServicePageRoute({ params }: Props) {
  const { slug } = await params
  const page = await getPublishedServicePage(slug)
  if (!page) notFound()

  const [org, relatedServices, relatedLocations] = await Promise.all([
    getOrganizationById(page.organization_id),
    getRelatedServicePages(page.organization_id, page.slug, 3),
    getRelatedLocationPages(page.organization_id, '', 4),
  ])

  return (
    <>
      {org && <JsonLd data={buildServicePageSchemas(page, org)} />}
      <ServicePageLayout page={page} />
      <RelatedServices services={relatedServices} />
      <RelatedLocations locations={relatedLocations} heading="We Also Serve" />
    </>
  )
}
