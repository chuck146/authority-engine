import { describe, it, expect } from 'vitest'
import { buildLocationPagePrompt } from '../location-page'
import { buildOrgContext } from '@/tests/factories'
import type { LocationPageInput } from '@/types/content'

const baseInput: LocationPageInput = {
  contentType: 'location_page',
  city: 'Summit',
  state: 'NJ',
  serviceName: 'Painting Services',
  tone: 'professional',
}

describe('buildLocationPagePrompt', () => {
  it('returns system and user strings', () => {
    const result = buildLocationPagePrompt(baseInput, buildOrgContext())
    expect(result).toHaveProperty('system')
    expect(result).toHaveProperty('user')
  })

  it('includes city and state in system prompt', () => {
    const result = buildLocationPagePrompt(baseInput, buildOrgContext())
    expect(result.system).toContain('Summit')
    expect(result.system).toContain('NJ')
  })

  it('includes city in user prompt', () => {
    const result = buildLocationPagePrompt(baseInput, buildOrgContext())
    expect(result.user).toContain('Summit')
  })

  it('includes service name in user prompt', () => {
    const result = buildLocationPagePrompt(baseInput, buildOrgContext())
    expect(result.user).toContain('Painting Services')
  })

  it('uses provided keywords when present', () => {
    const input: LocationPageInput = {
      ...baseInput,
      targetKeywords: ['painter summit nj'],
    }
    const result = buildLocationPagePrompt(input, buildOrgContext())
    expect(result.user).toContain('painter summit nj')
  })

  it('suggests AI-generated keywords when none provided', () => {
    const result = buildLocationPagePrompt(baseInput, buildOrgContext())
    expect(result.user).toContain('Identify and naturally incorporate')
  })
})
