import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getPublishedBlogPost,
  getOrganizationById,
  getRelatedBlogPosts,
  getRelatedServicePages,
} from '@/lib/queries/content'
import { buildBlogPostSchemas } from '@/lib/seo/json-ld'
import { BlogPostLayout } from '@/components/marketing/blog-post-layout'
import { JsonLd } from '@/components/marketing/json-ld'
import { RelatedBlogPosts, RelatedServices } from '@/components/marketing/related-links'
import type { StructuredContent } from '@/types/content'
import type { OrgSettings } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cleanestpaintingnj.com'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublishedBlogPost(slug)
  if (!post) return {}

  const content = post.content as unknown as StructuredContent
  return {
    title: content.meta_title,
    description: content.meta_description,
    alternates: { canonical: `${BASE_URL}/blog/${slug}` },
    openGraph: {
      title: content.meta_title,
      description: content.meta_description,
      url: `${BASE_URL}/blog/${slug}`,
      type: 'article',
      publishedTime: post.published_at ?? undefined,
      ...(post.featured_image_url && {
        images: [{ url: post.featured_image_url }],
      }),
    },
    twitter: {
      card: post.featured_image_url ? 'summary_large_image' : 'summary',
      title: content.meta_title ?? undefined,
      description: content.meta_description ?? undefined,
      ...(post.featured_image_url && { images: [post.featured_image_url] }),
    },
  }
}

export default async function BlogPostRoute({ params }: Props) {
  const { slug } = await params
  const post = await getPublishedBlogPost(slug)
  if (!post) notFound()

  const [org, relatedPosts, relatedServices] = await Promise.all([
    getOrganizationById(post.organization_id),
    getRelatedBlogPosts(post.organization_id, post.slug, 2),
    getRelatedServicePages(post.organization_id, '', 2),
  ])

  const settings = org?.settings as OrgSettings | null
  const phone = settings?.contact_info?.phone
  const rawEstimateUrl = settings?.estimate_url
  const estimateUrl =
    rawEstimateUrl && /^https?:\/\//i.test(rawEstimateUrl) ? rawEstimateUrl : undefined

  return (
    <>
      {org && <JsonLd data={buildBlogPostSchemas(post, org)} />}
      <BlogPostLayout post={post} phone={phone} estimateUrl={estimateUrl} />
      <RelatedBlogPosts posts={relatedPosts} />
      <RelatedServices services={relatedServices} />
    </>
  )
}
