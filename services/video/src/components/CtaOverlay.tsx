import { useCurrentFrame } from 'remotion'
import { fadeIn, slideUp } from '../lib/animations'
import { ensureFontsLoaded } from '../lib/fonts'

type CtaOverlayProps = {
  ctaText: string
  ctaUrl?: string
  startFrame: number
  accentColor: string
  textColor?: string
}

export function CtaOverlay({
  ctaText,
  ctaUrl,
  startFrame,
  accentColor,
  textColor = 'white',
}: CtaOverlayProps) {
  const frame = useCurrentFrame()
  const { dmSans } = ensureFontsLoaded()
  const opacity = fadeIn(frame, startFrame, 12)
  const y = slideUp(frame, startFrame, 15, 30)

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          backgroundColor: accentColor,
          padding: '16px 48px',
          borderRadius: 12,
          fontFamily: dmSans,
          fontSize: 28,
          fontWeight: 700,
          color: textColor,
          textAlign: 'center',
        }}
      >
        {ctaText}
      </div>
      {ctaUrl && (
        <div
          style={{
            fontFamily: dmSans,
            fontSize: 20,
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: 1,
          }}
        >
          {ctaUrl}
        </div>
      )}
    </div>
  )
}
