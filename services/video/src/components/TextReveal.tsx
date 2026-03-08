import { useCurrentFrame } from 'remotion'
import { fadeIn, slideUp } from '../lib/animations'
import { getFontFamily } from '../lib/fonts'

type TextRevealProps = {
  text: string
  startFrame: number
  color?: string
  fontSize?: number
  fontWeight?: number
  fontFamily?: string
  lineHeight?: number
  /** Frames between each word appearing */
  stagger?: number
}

export function TextReveal({
  text,
  startFrame,
  color = 'white',
  fontSize = 48,
  fontWeight = 600,
  fontFamily,
  lineHeight = 1.3,
  stagger = 3,
}: TextRevealProps) {
  const frame = useCurrentFrame()
  const resolvedFamily = fontFamily ?? getFontFamily('DMSans')
  const words = text.split(' ')

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: fontSize * 0.2,
        justifyContent: 'center',
        fontFamily: resolvedFamily,
        fontSize,
        fontWeight,
        lineHeight,
        color,
      }}
    >
      {words.map((word, i) => {
        const wordStart = startFrame + i * stagger
        const opacity = fadeIn(frame, wordStart, 8)
        const y = slideUp(frame, wordStart, 10, 20)

        return (
          <span
            key={i}
            style={{
              opacity,
              transform: `translateY(${y}px)`,
              display: 'inline-block',
            }}
          >
            {word}
          </span>
        )
      })}
    </div>
  )
}
