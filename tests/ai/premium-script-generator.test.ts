import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCallClaude = vi.fn()

vi.mock('@/lib/ai/claude', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/ai/claude')>()
  return {
    ...actual,
    callClaude: (...args: unknown[]) => mockCallClaude(...args),
  }
})

vi.mock('@/packages/ai/prompts/videos', () => ({
  buildPremiumScriptPrompt: vi.fn().mockReturnValue({
    system: 'You are a video script writer.',
    user: 'Create a 3-scene cinematic video script.',
  }),
}))

const { generatePremiumScript } = await import('@/lib/ai/premium-script-generator')
import { buildOrgContext, buildPremiumScript } from '../factories'
import type { PremiumReelInput } from '@/types/video'

const defaultInput: PremiumReelInput = {
  videoType: 'premium_reel',
  topic: 'Spring exterior painting in Summit NJ',
  style: 'cinematic',
  sceneCount: 3,
  model: 'veo-3.1-generate-preview',
  includeIntro: true,
  includeOutro: true,
}

describe('generatePremiumScript', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a validated PremiumScript from Claude response', async () => {
    const script = buildPremiumScript()
    mockCallClaude.mockResolvedValue(JSON.stringify(script))

    const result = await generatePremiumScript(defaultInput, buildOrgContext())

    expect(result.title).toBe('Spring Painting Transformation')
    expect(result.scenes).toHaveLength(3)
    expect(result.scenes[0]!.sceneNumber).toBe(1)
    expect(result.scenes[0]!.description).toBeTruthy()
    expect(result.scenes[0]!.audio).toBeTruthy()
    expect(result.scenes[0]!.imagePrompt).toBeTruthy()
  })

  it('calls Claude with correct options', async () => {
    mockCallClaude.mockResolvedValue(JSON.stringify(buildPremiumScript()))

    await generatePremiumScript(defaultInput, buildOrgContext())

    expect(mockCallClaude).toHaveBeenCalledWith({
      system: 'You are a video script writer.',
      user: 'Create a 3-scene cinematic video script.',
      maxTokens: 2048,
      temperature: 0.7,
    })
  })

  it('handles markdown-wrapped JSON from Claude', async () => {
    const script = buildPremiumScript()
    mockCallClaude.mockResolvedValue('```json\n' + JSON.stringify(script) + '\n```')

    const result = await generatePremiumScript(defaultInput, buildOrgContext())

    expect(result.title).toBe('Spring Painting Transformation')
  })

  it('truncates scenes when Claude returns more than requested', async () => {
    const script = buildPremiumScript()
    script.scenes.push({
      sceneNumber: 4,
      description: 'Extra scene that should be trimmed from the result output.',
      audio: 'Extra audio description that should also be trimmed.',
      imagePrompt: 'Extra image prompt for this additional scene, 1280x720.',
      durationHint: 8,
    })
    mockCallClaude.mockResolvedValue(JSON.stringify(script))

    const result = await generatePremiumScript(
      { ...defaultInput, sceneCount: 3 },
      buildOrgContext(),
    )

    expect(result.scenes).toHaveLength(3)
  })

  it('passes through when Claude returns fewer scenes than requested', async () => {
    const script = buildPremiumScript()
    script.scenes = script.scenes.slice(0, 2)
    mockCallClaude.mockResolvedValue(JSON.stringify(script))

    const result = await generatePremiumScript(
      { ...defaultInput, sceneCount: 3 },
      buildOrgContext(),
    )

    expect(result.scenes).toHaveLength(2)
  })

  it('throws on invalid JSON from Claude', async () => {
    mockCallClaude.mockResolvedValue('This is not JSON at all')

    await expect(generatePremiumScript(defaultInput, buildOrgContext())).rejects.toThrow()
  })

  it('throws on valid JSON that fails Zod validation', async () => {
    mockCallClaude.mockResolvedValue(JSON.stringify({ title: 'Missing scenes field' }))

    await expect(generatePremiumScript(defaultInput, buildOrgContext())).rejects.toThrow()
  })
})
