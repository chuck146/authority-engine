import Image from 'next/image'
import { Calendar, Clock } from 'lucide-react'
import type { BlogPost } from '@/types'
import type { StructuredContent } from '@/types/content'
import { PageHeader } from './page-header'
import { ContentBody } from './content-body'
import { PageFooterCta } from './page-footer-cta'

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function BlogPostLayout({ post }: { post: BlogPost }) {
  const content = post.content as unknown as StructuredContent

  return (
    <article>
      <PageHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Blog', href: '/blog' },
          { label: post.title },
        ]}
        title={content.headline}
      />
      <div className="text-muted-foreground mb-8 flex flex-wrap items-center gap-4 text-sm">
        {post.published_at && (
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formatDate(post.published_at)}
          </span>
        )}
        {post.reading_time_minutes && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {post.reading_time_minutes} min read
          </span>
        )}
        {post.category && (
          <span className="bg-muted rounded-full px-3 py-0.5">{post.category}</span>
        )}
      </div>
      {post.featured_image_url && (
        <div className="relative mb-8 aspect-video overflow-hidden rounded-lg">
          <Image
            src={post.featured_image_url}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}
      {post.excerpt && <p className="text-muted-foreground mb-8 text-lg italic">{post.excerpt}</p>}
      <ContentBody content={content} />
      {post.tags && post.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag} className="text-muted-foreground rounded-full border px-3 py-1 text-xs">
              {tag}
            </span>
          ))}
        </div>
      )}
      <PageFooterCta cta={content.cta} />
    </article>
  )
}
