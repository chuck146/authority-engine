import { describe, it, expect } from 'vitest'
import { buildBrandVoiceBlock, STRUCTURED_CONTENT_FORMAT_INSTRUCTION } from '../shared'
import { buildOrgContext } from '@/tests/factories'

describe('buildBrandVoiceBlock', () => {
  it('includes org name', () => {
    const result = buildBrandVoiceBlock(buildOrgContext())
    expect(result).toContain('Cleanest Painting LLC')
  })

  it('includes domain when present', () => {
    const result = buildBrandVoiceBlock(buildOrgContext({ domain: 'example.com' }))
    expect(result).toContain('Website: example.com')
  })

  it('excludes domain line when null', () => {
    const result = buildBrandVoiceBlock(buildOrgContext({ domain: null }))
    expect(result).not.toContain('Website:')
  })

  it('includes tagline when present', () => {
    const result = buildBrandVoiceBlock(buildOrgContext())
    expect(result).toContain('Where Artistry Meets Craftsmanship')
  })

  it('excludes tagline when branding has no tagline', () => {
    const result = buildBrandVoiceBlock(
      buildOrgContext({
        branding: { primary: '#000', secondary: '#fff', accent: '#ccc' },
      }),
    )
    expect(result).not.toContain('Tagline:')
  })

  it('includes service areas', () => {
    const result = buildBrandVoiceBlock(buildOrgContext())
    expect(result).toContain('NJ')
    expect(result).toContain('Union')
  })

  it('shows "Not specified" when service areas missing', () => {
    const result = buildBrandVoiceBlock(
      buildOrgContext({ serviceAreaStates: undefined, serviceAreaCounties: undefined }),
    )
    expect(result).toContain('Not specified')
  })
})

describe('STRUCTURED_CONTENT_FORMAT_INSTRUCTION', () => {
  it('contains JSON structure', () => {
    expect(STRUCTURED_CONTENT_FORMAT_INSTRUCTION).toContain('"headline"')
    expect(STRUCTURED_CONTENT_FORMAT_INSTRUCTION).toContain('"sections"')
    expect(STRUCTURED_CONTENT_FORMAT_INSTRUCTION).toContain('"meta_title"')
  })

  it('instructs to return only JSON', () => {
    expect(STRUCTURED_CONTENT_FORMAT_INSTRUCTION).toContain('Return ONLY the JSON object')
  })
})
