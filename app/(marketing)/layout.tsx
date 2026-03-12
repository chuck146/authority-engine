import {
  getOrganizationBySlug,
  getAllPublishedServiceLinks,
  getAllPublishedLocationLinks,
} from '@/lib/queries/content'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import type { OrgBranding, OrgSettings } from '@/types'

const ORG_SLUG = 'cleanest-painting'

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
  const estimateUrl = settings?.estimate_url
  const tagline = branding?.tagline ?? 'Where Artistry Meets Craftsmanship'

  const [services, locations] = await Promise.all([
    getAllPublishedServiceLinks(org.id),
    getAllPublishedLocationLinks(org.id),
  ])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <SiteHeader
        orgName={org.name}
        logoUrl={org.logo_url}
        estimateUrl={estimateUrl}
        phone={phone}
      />
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
