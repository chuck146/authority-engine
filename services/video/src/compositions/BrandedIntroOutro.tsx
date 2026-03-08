import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { BrandedBackground } from '../components/BrandedBackground'
import { Logo } from '../components/Logo'
import { fadeIn, fadeOut, slideUp, scaleIn } from '../lib/animations'
import { getFontFamily } from '../lib/fonts'
import type { BrandedIntroOutroProps } from '../types'

/**
 * Branded Intro/Outro composition.
 * Duration: 90 frames (3s @ 30fps), 1080x1920
 *
 * Intro timeline:
 *   0-20:  Logo scales in with spring
 *   20-40: Tagline fades in
 *   40-60: Hold
 *   60-90: Gentle fade out
 *
 * Outro timeline:
 *   0-15:  CTA slides up
 *   15-40: Logo fades in
 *   40-60: URL fades in
 *   60-90: Hold
 */
export function BrandedIntroOutro({ brand, mode, ctaText, ctaUrl }: BrandedIntroOutroProps) {
  const frame = useCurrentFrame()
  const headingFamily = getFontFamily(brand.headingFont ?? 'Montserrat')
  const bodyFamily = getFontFamily(brand.bodyFont ?? 'DMSans')

  if (mode === 'intro') {
    return (
      <IntroMode
        brand={brand}
        frame={frame}
        bodyFamily={bodyFamily}
        headingFamily={headingFamily}
      />
    )
  }

  return (
    <OutroMode
      brand={brand}
      frame={frame}
      bodyFamily={bodyFamily}
      headingFamily={headingFamily}
      ctaText={ctaText ?? 'Get Your Free Estimate'}
      ctaUrl={ctaUrl}
    />
  )
}

function IntroMode({
  brand,
  frame,
  bodyFamily,
  headingFamily,
}: {
  brand: BrandedIntroOutroProps['brand']
  frame: number
  bodyFamily: string
  headingFamily: string
}) {
  const logoScale = scaleIn(frame, 5, 20, 0.3)
  const logoOpacity = fadeIn(frame, 5, 12)
  const taglineOpacity = fadeIn(frame, 25, 12)
  const taglineY = slideUp(frame, 25, 15, 20)
  const overallFadeout = fadeOut(frame, 65, 25)
  const overallOpacity = frame < 65 ? 1 : overallFadeout

  return (
    <AbsoluteFill>
      <BrandedBackground brand={brand} variant="radial" />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 30,
          opacity: overallOpacity,
        }}
      >
        {/* Logo */}
        <div style={{ opacity: logoOpacity, transform: `scale(${logoScale})` }}>
          <Logo
            logoUrl={brand.logoUrl}
            orgName={brand.orgName}
            startFrame={0}
            size={160}
            fontFamily={headingFamily}
          />
        </div>

        {/* Tagline */}
        {brand.tagline && (
          <div
            style={{
              opacity: taglineOpacity,
              transform: `translateY(${taglineY}px)`,
              fontFamily: headingFamily,
              fontSize: 28,
              fontWeight: 300,
              color: 'rgba(255,255,255,0.85)',
              letterSpacing: 3,
              textTransform: 'uppercase',
              textAlign: 'center',
              maxWidth: 800,
            }}
          >
            {brand.tagline}
          </div>
        )}

        {/* Org name (if logo is image) */}
        {brand.logoUrl && (
          <div
            style={{
              opacity: taglineOpacity,
              fontFamily: bodyFamily,
              fontSize: 36,
              fontWeight: 600,
              color: 'white',
              textAlign: 'center',
            }}
          >
            {brand.orgName}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

function OutroMode({
  brand,
  frame,
  bodyFamily,
  headingFamily,
  ctaText,
  ctaUrl,
}: {
  brand: BrandedIntroOutroProps['brand']
  frame: number
  bodyFamily: string
  headingFamily: string
  ctaText: string
  ctaUrl?: string
}) {
  const ctaOpacity = fadeIn(frame, 5, 12)
  const ctaY = slideUp(frame, 5, 15, 40)
  const logoOpacity = fadeIn(frame, 20, 12)
  const urlOpacity = fadeIn(frame, 40, 12)

  return (
    <AbsoluteFill>
      <BrandedBackground brand={brand} variant="gradient" />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 40,
        }}
      >
        {/* CTA button */}
        <div
          style={{
            opacity: ctaOpacity,
            transform: `translateY(${ctaY}px)`,
            backgroundColor: brand.accentColor,
            padding: '20px 60px',
            borderRadius: 16,
            fontFamily: bodyFamily,
            fontSize: 34,
            fontWeight: 700,
            color: 'white',
          }}
        >
          {ctaText}
        </div>

        {/* Logo */}
        <div style={{ opacity: logoOpacity }}>
          <Logo
            logoUrl={brand.logoUrl}
            orgName={brand.orgName}
            startFrame={0}
            size={100}
            fontFamily={headingFamily}
          />
        </div>

        {/* URL */}
        {ctaUrl && (
          <div
            style={{
              opacity: urlOpacity,
              fontFamily: bodyFamily,
              fontSize: 24,
              color: 'rgba(255,255,255,0.6)',
              letterSpacing: 2,
            }}
          >
            {ctaUrl}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
