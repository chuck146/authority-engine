import { useCurrentFrame } from 'remotion'
import { fadeIn, scaleIn } from '../lib/animations'

type StarRatingProps = {
  rating: number
  startFrame: number
  starSize?: number
  filledColor?: string
  emptyColor?: string
}

export function StarRating({
  rating,
  startFrame,
  starSize = 40,
  filledColor = '#fbbf24',
  emptyColor = 'rgba(255,255,255,0.2)',
}: StarRatingProps) {
  const frame = useCurrentFrame()

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {Array.from({ length: 5 }).map((_, i) => {
        const starStart = startFrame + i * 4
        const opacity = fadeIn(frame, starStart, 8)
        const scale = scaleIn(frame, starStart, 12, 0.3)
        const isFilled = i < rating

        return (
          <div
            key={i}
            style={{
              opacity,
              transform: `scale(${scale})`,
              fontSize: starSize,
              color: isFilled ? filledColor : emptyColor,
              lineHeight: 1,
            }}
          >
            ★
          </div>
        )
      })}
    </div>
  )
}
