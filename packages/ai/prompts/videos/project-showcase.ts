import type { OrgContext } from '@/packages/ai/prompts/content/shared'
import type { ProjectShowcaseInput } from '@/types/video'
import { buildCompanyContext, buildBrandColorInstruction } from './shared'

export function buildProjectShowcasePrompt(
  input: ProjectShowcaseInput,
  org: OrgContext,
): { visual: string; audio: string } {
  const visual = [
    `Before: ${input.beforeDescription}`,
    `Slow transition to after: ${input.afterDescription}`,
    `Location: ${input.location}.`,
    buildCompanyContext(org),
    'Cinematic transformation reveal, warm golden hour lighting, smooth tracking shot.',
    buildBrandColorInstruction(org),
  ]
    .filter(Boolean)
    .join(' ')

  const audio =
    'Uplifting orchestral strings building to a satisfying crescendo during the reveal. Subtle ambient room tone and construction sounds transitioning to peaceful home ambiance.'

  return { visual, audio }
}
