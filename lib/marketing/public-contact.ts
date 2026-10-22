import { getMarketingOrganization } from '@/lib/queries/content'
import { getBusinessProfile, formatPublicAddress, telHref } from '@/lib/seo/business'
import { MARKETING_SMS_PHONE } from '@/lib/marketing/site'

export type PublicContact = {
  name: string
  phone?: string
  phoneHref?: string
  smsPhone: string
  smsPhoneHref: string
  email?: string
  address?: string
}

// Contact details for static pages (privacy, terms) — read from org settings so
// they always match the header, footer, and structured data.
export async function getPublicContact(): Promise<PublicContact> {
  const sms = { smsPhone: MARKETING_SMS_PHONE, smsPhoneHref: telHref(MARKETING_SMS_PHONE) }
  const org = await getMarketingOrganization()
  if (!org) return { name: 'Cleanest Painting LLC', ...sms }

  const profile = getBusinessProfile(org)
  return {
    name: profile.name,
    ...(profile.phone && { phone: profile.phone, phoneHref: telHref(profile.phone) }),
    ...sms,
    ...(profile.email && { email: profile.email }),
    address: formatPublicAddress(profile),
  }
}
