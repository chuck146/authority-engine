import { MapPin } from 'lucide-react'
import type { LocationPage } from '@/types'
import type { StructuredContent } from '@/types/content'
import { PageHeader } from './page-header'
import { ContentBody } from './content-body'
import { PageFooterCta } from './page-footer-cta'

export function LocationPageLayout({ page }: { page: LocationPage }) {
  const content = page.content as unknown as StructuredContent

  return (
    <article>
      <PageHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Locations', href: '/locations' },
          { label: `${page.city}, ${page.state}` },
        ]}
        title={content.headline}
        subtitle={`Serving ${page.city}, ${page.state}`}
      />
      {page.zip_codes && page.zip_codes.length > 0 && (
        <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>ZIP codes: {page.zip_codes.join(', ')}</span>
        </div>
      )}
      <ContentBody content={content} />
      <PageFooterCta cta={content.cta} />
    </article>
  )
}
