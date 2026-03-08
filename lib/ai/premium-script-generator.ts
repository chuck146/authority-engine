import { callClaude, parseClaudeJsonResponse } from './claude'
import { buildPremiumScriptPrompt } from '@/packages/ai/prompts/videos'
import { premiumScriptSchema, type PremiumScript, type PremiumReelInput } from '@/types/video'
import type { OrgContext } from '@/packages/ai/prompts/content/shared'

export async function generatePremiumScript(
  input: PremiumReelInput,
  orgContext: OrgContext,
): Promise<PremiumScript> {
  const prompt = buildPremiumScriptPrompt(input, orgContext)

  const rawResponse = await callClaude({
    system: prompt.system,
    user: prompt.user,
    maxTokens: 2048,
    temperature: 0.7,
  })

  const parsed = parseClaudeJsonResponse(rawResponse)
  const validated = premiumScriptSchema.parse(parsed)

  // Truncate scenes if Claude returned more than requested
  if (validated.scenes.length > input.sceneCount) {
    validated.scenes.length = input.sceneCount
  }

  return validated
}
