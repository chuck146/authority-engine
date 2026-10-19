import { describe, it, expect } from 'vitest'
import { buildBrandVoiceBlock, buildFactsGuardrail } from '../shared'
import { buildServicePagePrompt } from '../service-page'

const org = {
  orgName: 'Cleanest Painting LLC',
  domain: 'cleanestpaintingnj.com',
  branding: null,
  serviceAreaStates: ['NJ'],
  serviceAreaCounties: ['Union'],
}

describe('facts guardrail', () => {
  it('lists only owner-verified facts as allowed claims', () => {
    const block = buildFactsGuardrail({ ...org, verifiedFacts: ['Licensed and insured', ' '] })
    expect(block).toContain('- Licensed and insured')
    expect(block).not.toMatch(/^- $/m)
  })

  it('forbids invented company facts when none are verified', () => {
    const block = buildFactsGuardrail(org)
    expect(block).toContain('(none provided)')
    expect(block).toMatch(/Never invent company facts/)
    expect(block).toMatch(/testimonials/)
  })

  it('is part of every brand voice block', () => {
    expect(buildBrandVoiceBlock(org)).toContain('Accuracy rules')
  })

  it('service page prompt no longer asks for unsupported "why choose us" claims', () => {
    const { system } = buildServicePagePrompt(
      { contentType: 'service_page', serviceName: 'Interior Painting', tone: 'professional' },
      org,
    )
    expect(system).not.toMatch(/why choose us/i)
    expect(system).toMatch(/what affects cost and timing/)
  })
})
