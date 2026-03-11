import Link from 'next/link'
import type { RelatedServiceLink, RelatedLocationLink, RelatedBlogLink } from '@/types'

export function RelatedServices({
  services,
  heading = 'Related Services',
}: {
  services: RelatedServiceLink[]
  heading?: string
}) {
  if (services.length === 0) return null

  return (
    <section className="mt-12 border-t pt-8">
      <h2 className="mb-4 text-xl font-semibold">{heading}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Link
            key={service.slug}
            href={`/services/${service.slug}`}
            className="rounded-lg border p-4 transition-colors hover:bg-muted"
          >
            <span className="font-medium">{service.title}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function RelatedLocations({
  locations,
  heading = 'We Also Serve',
}: {
  locations: RelatedLocationLink[]
  heading?: string
}) {
  if (locations.length === 0) return null

  return (
    <section className="mt-8 border-t pt-8">
      <h2 className="mb-4 text-xl font-semibold">{heading}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {locations.map((location) => (
          <Link
            key={location.slug}
            href={`/locations/${location.slug}`}
            className="rounded-lg border p-4 transition-colors hover:bg-muted"
          >
            <span className="font-medium">
              {location.city}, {location.state}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function RelatedBlogPosts({ posts }: { posts: RelatedBlogLink[] }) {
  if (posts.length === 0) return null

  return (
    <section className="mt-8 border-t pt-8">
      <h2 className="mb-4 text-xl font-semibold">Related Articles</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="rounded-lg border p-4 transition-colors hover:bg-muted"
          >
            <span className="font-medium">{post.title}</span>
            {post.excerpt && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {post.excerpt}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
