import {
  getMarketingOrganization,
  getAllPublishedServiceLinks,
  getAllPublishedLocationLinks,
} from '@/lib/queries/content'
import { getBusinessProfile, formatPublicAddress, formatServiceArea } from '@/lib/seo/business'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { AttributionCapture } from '@/components/marketing/attribution-capture'
import { Ga4 } from '@/components/marketing/ga4'
import type { Metadata } from 'next'
import type { OrgBranding } from '@/types'

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
  const org = await getMarketingOrganization()

  if (!org) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <main>{children}</main>
      </div>
    )
  }

  const branding = org.branding as unknown as OrgBranding | null
  const profile = getBusinessProfile(org)
  const phone = profile.phone
  const tagline = branding?.tagline ?? 'Where Artistry Meets Craftsmanship'

  const [services, locations] = await Promise.all([
    getAllPublishedServiceLinks(org.id),
    getAllPublishedLocationLinks(org.id),
  ])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Ga4 />
      <AttributionCapture />
      <SiteHeader orgName={org.name} phone={phone} services={services} />
      <main>{children}</main>
      <SiteFooter
        orgName={org.name}
        tagline={tagline}
        logoUrl={org.logo_url}
        phone={phone}
        email={profile.email}
        address={formatPublicAddress(profile)}
        serviceArea={formatServiceArea(profile)}
        services={services}
        locations={locations}
      />
    </div>
  )
}
