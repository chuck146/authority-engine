import { z } from 'zod'

// --- Shared Brand Config (passed to all compositions) ---

export const remotionBrandConfigSchema = z.object({
  orgName: z.string(),
  tagline: z.string().optional(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  logoUrl: z.string().url().optional(),
  headingFont: z.string().default('Montserrat'),
  bodyFont: z.string().default('DMSans'),
})

export type RemotionBrandConfig = z.infer<typeof remotionBrandConfigSchema>

// --- Testimonial Quote ---

export const testimonialQuotePropsSchema = z.object({
  brand: remotionBrandConfigSchema,
  quote: z.string(),
  customerName: z.string(),
  starRating: z.number().min(1).max(5).optional(),
})

export type TestimonialQuoteProps = z.infer<typeof testimonialQuotePropsSchema>

// --- Tip Video ---

export const tipItemSchema = z.object({
  number: z.number(),
  text: z.string(),
})

export const tipVideoPropsSchema = z.object({
  brand: remotionBrandConfigSchema,
  title: z.string(),
  tips: z.array(tipItemSchema).min(1).max(7),
})

export type TipVideoProps = z.infer<typeof tipVideoPropsSchema>

// --- Branded Intro/Outro ---

export const brandedIntroOutroPropsSchema = z.object({
  brand: remotionBrandConfigSchema,
  mode: z.enum(['intro', 'outro']),
  ctaText: z.string().optional(),
  ctaUrl: z.string().optional(),
})

export type BrandedIntroOutroProps = z.infer<typeof brandedIntroOutroPropsSchema>

// --- Before/After Reveal ---

export const beforeAfterRevealPropsSchema = z.object({
  brand: remotionBrandConfigSchema,
  beforeImageUrl: z.string().url(),
  afterImageUrl: z.string().url(),
  location: z.string().optional(),
})

export type BeforeAfterRevealProps = z.infer<typeof beforeAfterRevealPropsSchema>

// --- Composition IDs ---

export const COMPOSITION_IDS = {
  TESTIMONIAL_QUOTE: 'TestimonialQuote',
  TIP_VIDEO: 'TipVideo',
  BRANDED_INTRO_OUTRO: 'BrandedIntroOutro',
  BEFORE_AFTER_REVEAL: 'BeforeAfterReveal',
} as const

export type CompositionId = (typeof COMPOSITION_IDS)[keyof typeof COMPOSITION_IDS]
