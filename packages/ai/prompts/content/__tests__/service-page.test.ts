import { describe, it, expect } from 'vitest'
import { buildServicePagePrompt } from '../service-page'
import { buildOrgContext } from '@/tests/factories'
import type { ServicePageInput } from '@/types/content'

const baseInput: ServicePageInput = {
  contentType: 'service_page',
  serviceName: 'Interior Painting',
  tone: 'professional',
}

describe('buildServicePagePrompt', () => {
  it('returns system and user strings', () => {
    const result = buildServicePagePrompt(baseInput, buildOrgContext())
    expect(result).toHaveProperty('system')
    expect(result).toHaveProperty('user')
    expect(typeof result.system).toBe('string')
    expect(typeof result.user).toBe('string')
  })

  it('includes tone in system prompt', () => {
    const result = buildServicePagePrompt(baseInput, buildOrgContext())
    expect(result.system).toContain('professional')
  })

  it('includes org name in system prompt', () => {
    const result = buildServicePagePrompt(baseInput, buildOrgContext())
    expect(result.system).toContain('Cleanest Painting LLC')
  })

  it('includes service name in user prompt', () => {
    const result = buildServicePagePrompt(baseInput, buildOrgContext())
    expect(result.user).toContain('Interior Painting')
  })

  it('uses provided keywords when present', () => {
    const input: ServicePageInput = {
      ...baseInput,
      targetKeywords: ['house painter', 'interior painting NJ'],
    }
    const result = buildServicePagePrompt(input, buildOrgContext())
    expect(result.user).toContain('house painter')
    expect(result.user).toContain('interior painting NJ')
  })

  it('suggests AI-generated keywords when none provided', () => {
    const result = buildServicePagePrompt(baseInput, buildOrgContext())
    expect(result.user).toContain('Identify and naturally incorporate')
  })

  it('includes serviceDescription when provided', () => {
    const input: ServicePageInput = {
      ...baseInput,
      serviceDescription: 'Full room painting including walls and ceilings',
    }
    const result = buildServicePagePrompt(input, buildOrgContext())
    expect(result.user).toContain('Full room painting including walls and ceilings')
  })
})
