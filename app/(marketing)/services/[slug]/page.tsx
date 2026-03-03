import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublishedServicePage } from '@/lib/queries/content'
import { ServicePageLayout } from '@/components/marketing/service-page-layout'
import type { StructuredContent } from '@/types/content'

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

  return <ServicePageLayout page={page} />
}
