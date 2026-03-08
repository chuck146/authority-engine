import { AbsoluteFill } from 'remotion'
import type { RemotionBrandConfig } from '../types'

type BrandedBackgroundProps = {
  brand: RemotionBrandConfig
  variant?: 'gradient' | 'solid' | 'radial'
}

export function BrandedBackground({ brand, variant = 'gradient' }: BrandedBackgroundProps) {
  const { primaryColor, secondaryColor, accentColor } = brand

  const backgroundStyle = (): React.CSSProperties => {
    switch (variant) {
      case 'solid':
        return { backgroundColor: primaryColor }
      case 'radial':
        return {
          background: `radial-gradient(ellipse at 30% 50%, ${accentColor}, ${primaryColor} 70%)`,
        }
      case 'gradient':
      default:
        return {
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 50%, ${primaryColor} 100%)`,
        }
    }
  }

  return (
    <AbsoluteFill style={backgroundStyle()}>
      {/* Subtle overlay pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.15) 100%)`,
        }}
      />
      {/* Decorative accent circle */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: secondaryColor,
          opacity: 0.08,
        }}
      />
    </AbsoluteFill>
  )
}
