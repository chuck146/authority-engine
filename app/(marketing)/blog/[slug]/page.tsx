import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublishedBlogPost } from '@/lib/queries/content'
import { BlogPostLayout } from '@/components/marketing/blog-post-layout'
import type { StructuredContent } from '@/types/content'

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
    openGraph: {
      title: content.meta_title,
      description: content.meta_description,
      type: 'article',
      publishedTime: post.published_at ?? undefined,
      ...(post.featured_image_url && {
        images: [{ url: post.featured_image_url }],
      }),
    },
  }
}

export default async function BlogPostRoute({ params }: Props) {
  const { slug } = await params
  const post = await getPublishedBlogPost(slug)
  if (!post) notFound()

  return <BlogPostLayout post={post} />
}
