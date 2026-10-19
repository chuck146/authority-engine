import type { Organization, OrgBranding, OrgSettings } from '@/types'

// Single source of truth for the business identity shown on the marketing site
// (header/footer NAP, legal pages) and in structured data. Everything here is
// derived from organizations.settings so visible text and JSON-LD never drift.

export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cleanestpaintingnj.com'
}

// Stable JSON-LD node id for the business entity, referenced from every page.
export function getBusinessId(): string {
  return `${getBaseUrl()}/#business`
}

export function getWebsiteId(): string {
  return `${getBaseUrl()}/#website`
}

// Official profiles for sameAs and the footer social links.
export const SOCIAL_PROFILES = {
  instagram: 'https://instagram.com/cleanestpainting',
  facebook: 'https://www.facebook.com/people/Cleanest-Painting-LLC/100065285028377/',
} as const

export type BusinessProfile = {
  name: string
  url: string
  logoUrl?: string
  tagline?: string
  phone?: string
  email?: string
  // Public address parts. Street is only included when explicitly opted in
  // (contact_info.show_street_address) — never publish a home address by default.
  streetAddress?: string
  locality?: string
  region?: string
  postalCode?: string
  country: string
  serviceAreaCounties: string[]
  serviceAreaState: string
  sameAs: string[]
}

export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return `${getBaseUrl()}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

export function getBusinessProfile(org: Organization): BusinessProfile {
  const branding = org.branding as unknown as OrgBranding | null
  const settings = org.settings as unknown as OrgSettings | null
  const contact = settings?.contact_info
  const address = contact?.address

  const street = address?.streetAddress?.trim()
  const city = address?.city?.trim()
  const showStreet =
    contact?.show_street_address === true &&
    !!street &&
    street.toLowerCase() !== city?.toLowerCase()

  return {
    name: org.name,
    url: getBaseUrl(),
    ...(org.logo_url && { logoUrl: absoluteUrl(org.logo_url) }),
    ...(branding?.tagline && { tagline: branding.tagline }),
    ...(contact?.phone && { phone: contact.phone }),
    ...(contact?.email && { email: contact.email }),
    ...(showStreet && { streetAddress: street }),
    ...(city && { locality: city }),
    ...(address?.state && { region: address.state }),
    ...(address?.postalCode && { postalCode: address.postalCode }),
    country: address?.country ?? 'US',
    serviceAreaCounties: settings?.service_area_counties ?? [],
    serviceAreaState: settings?.service_area_states?.[0] ?? 'NJ',
    sameAs: Object.values(SOCIAL_PROFILES),
  }
}

// "Union, Essex, Morris & Somerset counties" — one wording everywhere.
export function formatServiceArea(profile: BusinessProfile): string | undefined {
  const counties = profile.serviceAreaCounties
  if (counties.length === 0) return undefined
  if (counties.length === 1) return `${counties[0]} County`
  return `${counties.slice(0, -1).join(', ')} & ${counties.at(-1)} counties`
}

// "Rahway, NJ 07065" (plus street when opted in).
export function formatPublicAddress(profile: BusinessProfile): string | undefined {
  const cityState = [profile.locality, profile.region].filter(Boolean).join(', ')
  const line = [cityState, profile.postalCode].filter(Boolean).join(' ')
  if (!line) return undefined
  return profile.streetAddress ? `${profile.streetAddress}, ${line}` : line
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}
