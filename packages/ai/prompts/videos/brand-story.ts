import type { OrgContext } from '@/packages/ai/prompts/content/shared'
import type { BrandStoryInput } from '@/types/video'
import { buildCompanyContext, buildBrandColorInstruction } from './shared'

export function buildBrandStoryPrompt(
  input: BrandStoryInput,
  org: OrgContext,
): { visual: string; audio: string } {
  const styleMap: Record<string, string> = {
    cinematic: 'Cinematic wide shots with slow, elegant camera movement and dramatic lighting.',
    documentary: 'Documentary-style handheld footage, natural lighting, authentic and grounded.',
    energetic: 'Dynamic camera movement, quick transitions, vibrant and high-energy visuals.',
  }

  const styleInstruction = styleMap[input.style] ?? styleMap.cinematic!

  const visual = [
    input.narrative,
    buildCompanyContext(org),
    styleInstruction,
    'Professional home improvement storytelling, showcasing craftsmanship and attention to detail.',
    buildBrandColorInstruction(org),
  ]
    .filter(Boolean)
    .join(' ')

  const audio =
    'Inspiring orchestral score building emotional resonance. Ambient sounds of the craft — brush strokes, satisfying tape pulls, footsteps on fresh floors.'

  return { visual, audio }
}
