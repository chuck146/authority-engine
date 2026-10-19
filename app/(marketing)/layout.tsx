import {
  getOrganizationBySlug,
  getAllPublishedServiceLinks,
  getAllPublishedLocationLinks,
} from '@/lib/queries/content'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import type { Metadata } from 'next'
import type { OrgBranding, OrgSettings } from '@/types'

const ORG_SLUG = 'cleanest-painting'

// Overrides the root "| Authority Engine" (dashboard) title template. Content
// meta_titles already carry the business name, so they render unchanged.
export const metadata: Metadata = {
  title: {
    default: 'Cleanest Painting LLC — Painting Contractor in New Jersey',
    template: '%s',
  },
  description:
    'Interior and exterior painting, cabinet refinishing, and deck staining for New Jersey homes and businesses. Free estimates from Cleanest Painting LLC.',
}

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const org = await getOrganizationBySlug(ORG_SLUG)

  if (!org) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <main>{children}</main>
      </div>
    )
  }

  const branding = org.branding as unknown as OrgBranding | null
  const settings = org.settings as unknown as OrgSettings | null
  const phone = settings?.contact_info?.phone
  const email = settings?.contact_info?.email
  const tagline = branding?.tagline ?? 'Where Artistry Meets Craftsmanship'

  const [services, locations] = await Promise.all([
    getAllPublishedServiceLinks(org.id),
    getAllPublishedLocationLinks(org.id),
  ])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <SiteHeader orgName={org.name} phone={phone} services={services} />
      <main>{children}</main>
      <SiteFooter
        orgName={org.name}
        tagline={tagline}
        logoUrl={org.logo_url}
        phone={phone}
        email={email}
        address={settings?.contact_info?.address}
        services={services}
        locations={locations}
      />
    </div>
  )
}
