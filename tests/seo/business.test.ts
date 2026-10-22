import { describe, it, expect, vi } from 'vitest'
import {
  getBusinessProfile,
  formatServiceArea,
  formatPublicAddress,
  absoluteUrl,
  telHref,
} from '@/lib/seo/business'
import type { Organization } from '@/types'

vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://cleanestpaintingnj.com')

function org(settings: Record<string, unknown>, overrides?: Partial<Organization>): Organization {
  return {
    id: 'org-1',
    name: 'Cleanest Painting LLC',
    slug: 'cleanest-painting',
    logo_url: '/logo.png',
    branding: { tagline: 'Where Artistry Meets Craftsmanship' },
    settings,
    ...overrides,
  } as unknown as Organization
}

// Mirrors the production settings shape (street field holds the city name).
const productionLike = {
  service_area_states: ['NJ'],
  service_area_counties: ['Union', 'Essex', 'Morris', 'Somerset'],
  contact_info: {
    phone: '(732) 496-4607',
    email: 'home@cleanestpaintingnj.com',
    address: { streetAddress: 'Rahway', city: 'Rahway', state: 'NJ', postalCode: '07065' },
  },
}

describe('getBusinessProfile', () => {
  it('formats the public address without duplicating the city', () => {
    const profile = getBusinessProfile(org(productionLike))
    expect(formatPublicAddress(profile)).toBe('Rahway, NJ 07065')
  })

  it('hides a real street address unless opted in', () => {
    const settings = {
      contact_info: {
        address: { streetAddress: '12 Elm St', city: 'Rahway', state: 'NJ', postalCode: '07065' },
      },
    }
    expect(formatPublicAddress(getBusinessProfile(org(settings)))).toBe('Rahway, NJ 07065')

    const optedIn = {
      contact_info: { ...settings.contact_info, show_street_address: true },
    }
    expect(formatPublicAddress(getBusinessProfile(org(optedIn)))).toBe(
      '12 Elm St, Rahway, NJ 07065',
    )
  })

  it('makes the logo URL absolute', () => {
    expect(getBusinessProfile(org(productionLike)).logoUrl).toBe(
      'https://cleanestpaintingnj.com/logo.png',
    )
  })

  it('strips a trailing "County" and whitespace from service-area counties', () => {
    const profile = getBusinessProfile(
      org({ service_area_counties: ['Union County', ' essex ', 'Morris county', '  '] }),
    )
    expect(profile.serviceAreaCounties).toEqual(['Union', 'essex', 'Morris'])
    expect(formatServiceArea(profile)).toBe('Union, essex & Morris counties')
    expect(formatServiceArea(profile)).not.toMatch(/county counties/i)
  })

  it('does not double "County" for a single county stored with the suffix', () => {
    const profile = getBusinessProfile(org({ service_area_counties: ['Union County'] }))
    expect(formatServiceArea(profile)).toBe('Union County')
  })

  it('returns undefined address when no location is configured', () => {
    expect(formatPublicAddress(getBusinessProfile(org({})))).toBeUndefined()
  })
})

describe('formatServiceArea', () => {
  it('joins counties with a final ampersand', () => {
    expect(formatServiceArea(getBusinessProfile(org(productionLike)))).toBe(
      'Union, Essex, Morris & Somerset counties',
    )
  })

  it('handles a single county and none', () => {
    expect(formatServiceArea(getBusinessProfile(org({ service_area_counties: ['Union'] })))).toBe(
      'Union County',
    )
    expect(formatServiceArea(getBusinessProfile(org({})))).toBeUndefined()
  })
})

describe('helpers', () => {
  it('absoluteUrl leaves absolute URLs alone', () => {
    expect(absoluteUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png')
    expect(absoluteUrl('logo.png')).toBe('https://cleanestpaintingnj.com/logo.png')
  })

  it('telHref strips formatting', () => {
    expect(telHref('(732) 496-4607')).toBe('tel:7324964607')
  })
})
