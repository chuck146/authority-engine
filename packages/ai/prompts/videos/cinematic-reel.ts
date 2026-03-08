import type { OrgContext } from '@/packages/ai/prompts/content/shared'
import type { CinematicReelInput } from '@/types/video'
import { buildCompanyContext, buildBrandColorInstruction } from './shared'

export function buildCinematicReelPrompt(
  input: CinematicReelInput,
  org: OrgContext,
): { visual: string; audio: string } {
  const visual = [
    input.sceneDescription,
    buildCompanyContext(org),
    'Cinematic quality, shallow depth of field, smooth camera movement.',
    'Professional home improvement setting, warm natural lighting.',
    buildBrandColorInstruction(org),
  ]
    .filter(Boolean)
    .join(' ')

  const audio = [
    input.audioMood,
    'Professional ambient sound design appropriate for a home improvement brand.',
  ].join(' ')

  return { visual, audio }
}
