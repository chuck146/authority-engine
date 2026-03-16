import type { StructuredContent } from '@/types/content'
import { HeroSection } from './hero-section'
import { ContentBody } from './content-body'
import { BrandedCta } from './branded-cta'

type ServicePageData = {
  title: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any
  hero_image_url?: string | null
}

type ServicePageLayoutProps = {
  page: ServicePageData
  phone?: string
  estimateUrl?: string
  breadcrumbs?: { label: string; href?: string }[]
}

export function ServicePageLayout({
  page,
  phone,
  estimateUrl,
  breadcrumbs,
}: ServicePageLayoutProps) {
  const content = page.content as unknown as StructuredContent

  const defaultBreadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services' },
    { label: page.title },
  ]

  return (
    <article>
      <HeroSection
        imageUrl={page.hero_image_url ?? null}
        breadcrumbs={breadcrumbs ?? defaultBreadcrumbs}
        title={content.headline}
      />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <ContentBody content={content} />
        <BrandedCta cta={content.cta} phone={phone} estimateUrl={estimateUrl} />
      </div>
    </article>
  )
}
