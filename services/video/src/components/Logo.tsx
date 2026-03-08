import { useCurrentFrame } from 'remotion'
import { Img } from 'remotion'
import { fadeIn, scaleIn } from '../lib/animations'
import { getFontFamily } from '../lib/fonts'

type LogoProps = {
  logoUrl?: string
  orgName: string
  startFrame?: number
  size?: number
  fontFamily?: string
}

export function Logo({ logoUrl, orgName, startFrame = 0, size = 120, fontFamily }: LogoProps) {
  const frame = useCurrentFrame()
  const opacity = fadeIn(frame, startFrame, 15)
  const scale = scaleIn(frame, startFrame, 20)

  if (!logoUrl) {
    // Fallback: text-based logo
    return (
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          fontFamily: fontFamily ?? getFontFamily('Montserrat'),
          fontSize: size * 0.3,
          fontWeight: 700,
          color: 'white',
          textAlign: 'center',
        }}
      >
        {orgName}
      </div>
    )
  }

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Img
        src={logoUrl}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
        }}
      />
    </div>
  )
}
