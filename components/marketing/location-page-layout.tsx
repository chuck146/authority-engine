import { MapPin } from 'lucide-react'
import type { LocationPage } from '@/types'
import type { StructuredContent } from '@/types/content'
import { HeroSection } from './hero-section'
import { ContentBody } from './content-body'
import { BrandedCta } from './branded-cta'

type LocationPageLayoutProps = {
  page: LocationPage
  phone?: string
  estimateUrl?: string
}

export function LocationPageLayout({ page, phone, estimateUrl }: LocationPageLayoutProps) {
  const content = page.content as unknown as StructuredContent
  const zipBadge =
    page.zip_codes && page.zip_codes.length > 0 ? `ZIP: ${page.zip_codes.join(', ')}` : undefined

  return (
    <article>
      <HeroSection
        imageUrl={(page as Record<string, unknown>).hero_image_url as string | null}
        imageAlt={`Professional painting services in ${page.city}, ${page.state}`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Locations', href: '/locations' },
          { label: `${page.city}, ${page.state}` },
        ]}
        title={content.headline}
        subtitle={`Serving ${page.city}, ${page.state}`}
        badge={zipBadge}
      />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {page.zip_codes && page.zip_codes.length > 0 && (
          <div className="text-muted-foreground mb-8 flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4" />
            <span>Service areas: {page.zip_codes.join(', ')}</span>
          </div>
        )}
        <ContentBody content={content} />
        <BrandedCta cta={content.cta} phone={phone} estimateUrl={estimateUrl} />
      </div>
    </article>
  )
}
