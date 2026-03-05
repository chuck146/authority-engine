// Character limits per platform
export const PLATFORM_LIMITS = {
  gbp: 1500,
  instagram: 2200,
  facebook: 63206,
} as const

export const SOCIAL_POST_FORMAT_INSTRUCTION = `
Return your response as valid JSON matching this exact structure:
{
  "body": "string - the post caption/text",
  "hashtags": ["string array - relevant hashtags WITHOUT the # symbol"],
  "cta_type": "string or null - call-to-action type if applicable",
  "cta_url": "string or null - call-to-action URL if applicable",
  "image_prompt": "string - a detailed image generation prompt for an accompanying visual"
}

IMPORTANT: Return ONLY the JSON object. No markdown code fences, no explanation, no preamble.
`
