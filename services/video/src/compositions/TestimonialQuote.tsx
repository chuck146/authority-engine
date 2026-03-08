import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { BrandedBackground } from '../components/BrandedBackground'
import { Logo } from '../components/Logo'
import { TextReveal } from '../components/TextReveal'
import { StarRating } from '../components/StarRating'
import { CtaOverlay } from '../components/CtaOverlay'
import { fadeIn, slideUp } from '../lib/animations'
import { ensureFontsLoaded } from '../lib/fonts'
import type { TestimonialQuoteProps } from '../types'

/**
 * Testimonial Quote composition.
 * Duration: 180 frames (6s @ 30fps), 1080x1920
 *
 * Timeline:
 *   0-15:   Background fades in
 *   15-60:  Quote text reveals word-by-word
 *   70-90:  Customer name slides up
 *   80-110: Star rating animates (if provided)
 *   120-150: Logo + CTA fade in
 *   150-180: Hold
 */
export function TestimonialQuote({
  brand,
  quote,
  customerName,
  starRating,
}: TestimonialQuoteProps) {
  const frame = useCurrentFrame()
  const { dmSans } = ensureFontsLoaded()

  // Quote mark opacity
  const quoteMarkOpacity = fadeIn(frame, 10, 10)

  // Customer name
  const nameOpacity = fadeIn(frame, 70, 12)
  const nameY = slideUp(frame, 70, 15)

  return (
    <AbsoluteFill>
      <BrandedBackground brand={brand} variant="gradient" />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '80px 60px',
        }}
      >
        {/* Opening quote mark */}
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 120,
            color: brand.secondaryColor,
            opacity: quoteMarkOpacity,
            lineHeight: 0.8,
            marginBottom: 20,
          }}
        >
          &ldquo;
        </div>

        {/* Quote text - word-by-word reveal */}
        <div style={{ maxWidth: 900, textAlign: 'center' }}>
          <TextReveal
            text={quote}
            startFrame={15}
            fontSize={44}
            fontWeight={500}
            lineHeight={1.4}
            stagger={3}
          />
        </div>

        {/* Customer name */}
        <div
          style={{
            marginTop: 40,
            opacity: nameOpacity,
            transform: `translateY(${nameY}px)`,
            fontFamily: dmSans,
            fontSize: 28,
            fontWeight: 600,
            color: brand.secondaryColor,
            letterSpacing: 1,
          }}
        >
          — {customerName}
        </div>

        {/* Star rating */}
        {starRating && (
          <div style={{ marginTop: 24 }}>
            <StarRating rating={starRating} startFrame={80} filledColor={brand.secondaryColor} />
          </div>
        )}
      </AbsoluteFill>

      {/* Logo + CTA at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 140,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Logo logoUrl={brand.logoUrl} orgName={brand.orgName} startFrame={120} size={80} />
      </div>

      <CtaOverlay
        ctaText="Get Your Free Estimate"
        startFrame={130}
        accentColor={brand.accentColor}
      />
    </AbsoluteFill>
  )
}
