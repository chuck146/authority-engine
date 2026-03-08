import { Composition } from 'remotion'
import { TestimonialQuote } from './compositions/TestimonialQuote'
import { TipVideo } from './compositions/TipVideo'
import { BrandedIntroOutro } from './compositions/BrandedIntroOutro'
import { BeforeAfterReveal } from './compositions/BeforeAfterReveal'
import {
  testimonialQuotePropsSchema,
  tipVideoPropsSchema,
  brandedIntroOutroPropsSchema,
  beforeAfterRevealPropsSchema,
  COMPOSITION_IDS,
} from './types'

const DEFAULT_BRAND = {
  orgName: 'Cleanest Painting LLC',
  tagline: 'Where Artistry Meets Craftsmanship',
  primaryColor: '#1B2B5B',
  secondaryColor: '#fbbf24',
  accentColor: '#1e3a5f',
  headingFont: 'Montserrat',
  bodyFont: 'DMSans',
}

export function Root() {
  return (
    <>
      <Composition
        id={COMPOSITION_IDS.TESTIMONIAL_QUOTE}
        component={TestimonialQuote}
        schema={testimonialQuotePropsSchema}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          brand: DEFAULT_BRAND,
          quote:
            'They transformed our home beautifully. The attention to detail was incredible and the team was so professional.',
          customerName: 'Sarah M.',
          starRating: 5,
        }}
      />

      <Composition
        id={COMPOSITION_IDS.TIP_VIDEO}
        component={TipVideo}
        schema={tipVideoPropsSchema}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          brand: DEFAULT_BRAND,
          title: '5 Tips for Choosing Paint Colors',
          tips: [
            { number: 1, text: 'Test colors in natural light' },
            { number: 2, text: 'Consider the room direction' },
            { number: 3, text: 'Start with neutrals' },
            { number: 4, text: 'Use the 60-30-10 rule' },
            { number: 5, text: 'Get professional samples' },
          ],
        }}
      />

      <Composition
        id={COMPOSITION_IDS.BRANDED_INTRO_OUTRO}
        component={BrandedIntroOutro}
        schema={brandedIntroOutroPropsSchema}
        durationInFrames={90}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          brand: DEFAULT_BRAND,
          mode: 'intro' as const,
          ctaText: 'Get Your Free Estimate',
          ctaUrl: 'cleanestpainting.com',
        }}
      />

      <Composition
        id={COMPOSITION_IDS.BEFORE_AFTER_REVEAL}
        component={BeforeAfterReveal}
        schema={beforeAfterRevealPropsSchema}
        durationInFrames={240}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          brand: DEFAULT_BRAND,
          beforeImageUrl: 'https://placehold.co/1080x1200/8B7355/white?text=Before',
          afterImageUrl: 'https://placehold.co/1080x1200/1B2B5B/white?text=After',
          location: 'Summit, NJ',
        }}
      />
    </>
  )
}
