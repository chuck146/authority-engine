import type { StructuredContent } from '@/types/content'
import { buildStructuredContent } from '../factories'

export function mockClaudeJsonResponse(overrides?: Partial<StructuredContent>): string {
  return JSON.stringify(buildStructuredContent(overrides))
}

export function mockClaudeJsonWithFences(overrides?: Partial<StructuredContent>): string {
  return `\`\`\`json\n${JSON.stringify(buildStructuredContent(overrides), null, 2)}\n\`\`\``
}
