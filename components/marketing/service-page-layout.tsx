import type { ServicePage } from '@/types'
import type { StructuredContent } from '@/types/content'
import { HeroSection } from './hero-section'
import { ContentBody } from './content-body'
import { BrandedCta } from './branded-cta'

type ServicePageLayoutProps = {
  page: ServicePage
  phone?: string
  estimateUrl?: string
}

export function ServicePageLayout({ page, phone, estimateUrl }: ServicePageLayoutProps) {
  const content = page.content as unknown as StructuredContent

  return (
    <article>
      <HeroSection
        imageUrl={(page as Record<string, unknown>).hero_image_url as string | null}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Services', href: '/services' },
          { label: page.title },
        ]}
        title={content.headline}
      />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <ContentBody content={content} />
        <BrandedCta cta={content.cta} phone={phone} estimateUrl={estimateUrl} />
      </div>
    </article>
  )
}
