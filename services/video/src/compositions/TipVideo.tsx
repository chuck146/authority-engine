import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { BrandedBackground } from '../components/BrandedBackground'
import { Logo } from '../components/Logo'
import { CtaOverlay } from '../components/CtaOverlay'
import { fadeIn, slideUp, scaleIn } from '../lib/animations'
import { getFontFamily } from '../lib/fonts'
import type { TipVideoProps } from '../types'

/**
 * Tip Video composition.
 * Duration: 300 frames (10s @ 30fps), 1080x1920
 *
 * Timeline:
 *   0-30:    Title slides in
 *   40+:     Tips appear sequentially (staggered ~30 frames apart)
 *   240-270: Logo + CTA
 *   270-300: Hold
 */
export function TipVideo({ brand, title, tips }: TipVideoProps) {
  const frame = useCurrentFrame()
  const headingFamily = getFontFamily(brand.headingFont ?? 'Montserrat')
  const bodyFamily = getFontFamily(brand.bodyFont ?? 'DMSans')

  // Title animation
  const titleOpacity = fadeIn(frame, 5, 15)
  const titleY = slideUp(frame, 5, 20, 40)

  // Calculate timing: distribute tips across available frames
  const tipStartFrame = 40
  const tipSpacing = Math.min(35, Math.floor(180 / tips.length))

  return (
    <AbsoluteFill>
      <BrandedBackground brand={brand} variant="radial" />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '100px 60px 200px',
        }}
      >
        {/* Title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            fontFamily: headingFamily,
            fontSize: 52,
            fontWeight: 700,
            color: 'white',
            textAlign: 'center',
            marginBottom: 50,
          }}
        >
          {title}
        </div>

        {/* Tips list */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            flex: 1,
            justifyContent: 'center',
          }}
        >
          {tips.map((tip, i) => {
            const itemStart = tipStartFrame + i * tipSpacing
            const opacity = fadeIn(frame, itemStart, 12)
            const y = slideUp(frame, itemStart, 15, 30)
            const badgeScale = scaleIn(frame, itemStart, 12, 0.5)

            return (
              <div
                key={i}
                style={{
                  opacity,
                  transform: `translateY(${y}px)`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 20,
                  padding: '16px 24px',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderRadius: 16,
                  borderLeft: `4px solid ${brand.secondaryColor}`,
                }}
              >
                {/* Number badge */}
                <div
                  style={{
                    transform: `scale(${badgeScale})`,
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: brand.accentColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: bodyFamily,
                    fontSize: 24,
                    fontWeight: 700,
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  {tip.number}
                </div>

                {/* Tip text */}
                <div
                  style={{
                    fontFamily: bodyFamily,
                    fontSize: 30,
                    fontWeight: 400,
                    color: 'white',
                    lineHeight: 1.4,
                    paddingTop: 6,
                  }}
                >
                  {tip.text}
                </div>
              </div>
            )
          })}
        </div>
      </AbsoluteFill>

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
        <Logo
          logoUrl={brand.logoUrl}
          orgName={brand.orgName}
          startFrame={240}
          size={60}
          fontFamily={headingFamily}
        />
      </div>

      <CtaOverlay
        ctaText="Get Your Free Estimate"
        startFrame={250}
        accentColor={brand.accentColor}
        fontFamily={bodyFamily}
      />
    </AbsoluteFill>
  )
}
