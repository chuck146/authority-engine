// Shared constants for the public marketing site (cleanestpaintingnj.com).

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cleanestpaintingnj.com'

// The organization whose published content is served on the marketing domain.
export const MARKETING_ORG_SLUG = 'cleanest-painting'

// The number registered for the SMS program (texts are sent from it). Shown only
// in the SMS sections of /privacy and /terms; the direct line comes from org settings.
export const MARKETING_SMS_PHONE = '(732) 913-8574'
