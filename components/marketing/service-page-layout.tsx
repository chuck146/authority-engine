import type { ServicePage } from '@/types'
import type { StructuredContent } from '@/types/content'
import { PageHeader } from './page-header'
import { ContentBody } from './content-body'
import { PageFooterCta } from './page-footer-cta'

export function ServicePageLayout({ page }: { page: ServicePage }) {
  const content = page.content as unknown as StructuredContent

  return (
    <article>
      <PageHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Services', href: '/services' },
          { label: page.title },
        ]}
        title={content.headline}
      />
      <ContentBody content={content} />
      <PageFooterCta cta={content.cta} />
    </article>
  )
}
