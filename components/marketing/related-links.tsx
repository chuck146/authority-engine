import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
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
    <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="mt-12 border-t pt-8">
        <h2 className="mb-4 text-xl font-semibold">{heading}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="group flex items-center justify-between rounded-lg border p-4 transition-all hover:border-[#1B2B5B]/30 hover:shadow-md"
            >
              <span className="font-medium">{service.title}</span>
              <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#1B2B5B]" />
            </Link>
          ))}
        </div>
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
    <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="mt-8 border-t pt-8 pb-12">
        <h2 className="mb-4 text-xl font-semibold">{heading}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {locations.map((location) => (
            <Link
              key={location.slug}
              href={`/locations/${location.slug}`}
              className="group flex items-center gap-2 rounded-lg border p-4 transition-all hover:border-[#1B2B5B]/30 hover:shadow-md"
            >
              <MapPin className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-amber-500" />
              <span className="font-medium">
                {location.city}, {location.state}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export function RelatedBlogPosts({ posts }: { posts: RelatedBlogLink[] }) {
  if (posts.length === 0) return null

  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="mt-8 border-t pt-8 pb-12">
        <h2 className="mb-4 text-xl font-semibold">Related Articles</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-lg border p-4 transition-all hover:border-[#1B2B5B]/30 hover:shadow-md"
            >
              <span className="font-medium">{post.title}</span>
              {post.excerpt && (
                <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{post.excerpt}</p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
