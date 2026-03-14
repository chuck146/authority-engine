import { Calendar, Clock } from 'lucide-react'
import type { BlogPost } from '@/types'
import type { StructuredContent } from '@/types/content'
import { HeroSection } from './hero-section'
import { ContentBody } from './content-body'
import { BrandedCta } from './branded-cta'

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

type BlogPostLayoutProps = {
  post: BlogPost
  phone?: string
  estimateUrl?: string
}

export function BlogPostLayout({ post, phone, estimateUrl }: BlogPostLayoutProps) {
  const content = post.content as unknown as StructuredContent

  return (
    <article>
      <HeroSection
        imageUrl={post.featured_image_url}
        imageAlt={`${post.title} — Cleanest Painting blog`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Blog', href: '/blog' },
          { label: post.title },
        ]}
        title={content.headline}
        badge={post.category ?? undefined}
      />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
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
        </div>
        {post.excerpt && (
          <p className="text-muted-foreground mb-8 border-l-4 border-amber-400 pl-4 text-lg italic">
            {post.excerpt}
          </p>
        )}
        <ContentBody content={content} />
        {post.tags && post.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-muted-foreground rounded-full border px-3 py-1 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <BrandedCta cta={content.cta} phone={phone} estimateUrl={estimateUrl} />
      </div>
    </article>
  )
}
