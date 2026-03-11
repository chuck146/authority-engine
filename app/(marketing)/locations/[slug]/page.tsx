import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getPublishedLocationPage,
  getOrganizationById,
  getAllPublishedServiceLinks,
  getRelatedLocationPages,
} from '@/lib/queries/content'
import { buildLocationPageSchemas } from '@/lib/seo/json-ld'
import { LocationPageLayout } from '@/components/marketing/location-page-layout'
import { JsonLd } from '@/components/marketing/json-ld'
import { RelatedServices, RelatedLocations } from '@/components/marketing/related-links'
import type { StructuredContent } from '@/types/content'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cleanestpaintingnj.com'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await getPublishedLocationPage(slug)
  if (!page) return {}

  const content = page.content as unknown as StructuredContent
  return {
    title: content.meta_title,
    description: content.meta_description,
    alternates: { canonical: `${BASE_URL}/locations/${slug}` },
    openGraph: {
      title: content.meta_title,
      description: content.meta_description,
      type: 'website',
    },
  }
}

export default async function LocationPageRoute({ params }: Props) {
  const { slug } = await params
  const page = await getPublishedLocationPage(slug)
  if (!page) notFound()

  const [org, allServices, nearbyLocations] = await Promise.all([
    getOrganizationById(page.organization_id),
    getAllPublishedServiceLinks(page.organization_id),
    getRelatedLocationPages(page.organization_id, page.slug, 3),
  ])

  return (
    <>
      {org && <JsonLd data={buildLocationPageSchemas(page, org)} />}
      <LocationPageLayout page={page} />
      <RelatedServices services={allServices} heading={`Services in ${page.city}`} />
      <RelatedLocations locations={nearbyLocations} heading="Nearby Areas" />
    </>
  )
}
