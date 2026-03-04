import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublishedLocationPage } from '@/lib/queries/content'
import { LocationPageLayout } from '@/components/marketing/location-page-layout'
import type { StructuredContent } from '@/types/content'

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

  return <LocationPageLayout page={page} />
}
