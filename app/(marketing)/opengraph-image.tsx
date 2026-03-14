import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Cleanest Painting LLC — Professional Painting Services in NJ'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1B2B5B 0%, #1e3a5f 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: 1.2,
              maxWidth: '900px',
            }}
          >
            Cleanest Painting LLC
          </div>
          <div
            style={{
              width: 80,
              height: 4,
              background: '#fbbf24',
              borderRadius: 2,
            }}
          />
          <div
            style={{
              fontSize: 28,
              color: '#fbbf24',
              fontWeight: 500,
              letterSpacing: '0.05em',
            }}
          >
            Where Artistry Meets Craftsmanship
          </div>
          <div
            style={{
              fontSize: 22,
              color: 'rgba(255,255,255,0.7)',
              marginTop: '12px',
            }}
          >
            Professional Painting Services in New Jersey
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
