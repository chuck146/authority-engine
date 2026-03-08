import { AbsoluteFill, Img, useCurrentFrame } from 'remotion'
import { BrandedBackground } from '../components/BrandedBackground'
import { Logo } from '../components/Logo'
import { CtaOverlay } from '../components/CtaOverlay'
import { fadeIn, slideUp, wipeReveal } from '../lib/animations'
import { getFontFamily } from '../lib/fonts'
import type { BeforeAfterRevealProps } from '../types'

/**
 * Before/After Reveal composition.
 * Duration: 240 frames (8s @ 30fps), 1080x1920
 *
 * Timeline:
 *   0-20:    "Before" label fades in
 *   10-30:   Before image fades in
 *   30-80:   Hold on "before"
 *   80-140:  Wipe transition reveals "after" image
 *   100-120: "After" label slides in
 *   140-180: Hold on "after"
 *   180-210: Logo + CTA
 *   210-240: Hold
 */
export function BeforeAfterReveal({
  brand,
  beforeImageUrl,
  afterImageUrl,
  location,
}: BeforeAfterRevealProps) {
  const frame = useCurrentFrame()
  const headingFamily = getFontFamily(brand.headingFont ?? 'Montserrat')
  const bodyFamily = getFontFamily(brand.bodyFont ?? 'DMSans')

  // Before image + label
  const beforeOpacity = fadeIn(frame, 10, 15)
  const beforeLabelOpacity = fadeIn(frame, 5, 10)
  const beforeLabelY = slideUp(frame, 5, 12, 20)

  // Wipe transition
  const wipePercent = wipeReveal(frame, 80, 60)

  // After label
  const afterLabelOpacity = fadeIn(frame, 100, 10)
  const afterLabelY = slideUp(frame, 100, 12, 20)

  // Location label
  const locationOpacity = fadeIn(frame, 120, 10)

  return (
    <AbsoluteFill>
      <BrandedBackground brand={brand} />

      {/* Image container - centered */}
      <div
        style={{
          position: 'absolute',
          top: 200,
          left: 40,
          right: 40,
          height: 1200,
          borderRadius: 20,
          overflow: 'hidden',
        }}
      >
        {/* Before image (full size, behind) */}
        <div style={{ position: 'absolute', inset: 0, opacity: beforeOpacity }}>
          <Img
            src={beforeImageUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>

        {/* After image (clipped by wipe) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: `inset(0 ${100 - wipePercent}% 0 0)`,
          }}
        >
          <Img
            src={afterImageUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>

        {/* Wipe line indicator */}
        {wipePercent > 0 && wipePercent < 100 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${wipePercent}%`,
              width: 4,
              backgroundColor: brand.secondaryColor,
              boxShadow: `0 0 20px ${brand.secondaryColor}`,
            }}
          />
        )}

        {/* Before label */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            opacity: beforeLabelOpacity,
            transform: `translateY(${beforeLabelY}px)`,
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '8px 20px',
            borderRadius: 8,
            fontFamily: headingFamily,
            fontSize: 24,
            fontWeight: 700,
            color: 'white',
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          Before
        </div>

        {/* After label */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            opacity: afterLabelOpacity,
            transform: `translateY(${afterLabelY}px)`,
            backgroundColor: brand.accentColor,
            padding: '8px 20px',
            borderRadius: 8,
            fontFamily: headingFamily,
            fontSize: 24,
            fontWeight: 700,
            color: 'white',
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          After
        </div>
      </div>

      {/* Location label */}
      {location && (
        <div
          style={{
            position: 'absolute',
            top: 1430,
            left: 0,
            right: 0,
            textAlign: 'center',
            opacity: locationOpacity,
            fontFamily: bodyFamily,
            fontSize: 28,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.8)',
          }}
        >
          {location}
        </div>
      )}

      {/* Logo + CTA */}
      <div
        style={{
          position: 'absolute',
          bottom: 160,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Logo logoUrl={brand.logoUrl} orgName={brand.orgName} startFrame={180} size={60} fontFamily={headingFamily} />
      </div>

      <CtaOverlay
        ctaText="Get Your Free Estimate"
        startFrame={190}
        accentColor={brand.accentColor}
        fontFamily={bodyFamily}
      />
    </AbsoluteFill>
  )
}
