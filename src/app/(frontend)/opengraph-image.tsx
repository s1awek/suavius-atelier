import { ImageResponse } from 'next/og'

export const alt = 'Suavius Atelier - hand-designed PCB coasters and wood accessories'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#f5f0e8',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '80px',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div
          style={{
            fontSize: 28,
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            color: '#b87333',
            marginBottom: 32,
          }}
        >
          Suavius Atelier
        </div>
        <div
          style={{
            fontSize: 76,
            color: '#1a1714',
            textAlign: 'center',
            lineHeight: 1.1,
            maxWidth: 1000,
          }}
        >
          Hand-designed PCB coasters & engraved wood accessories
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 24,
            color: '#8c7b6b',
          }}
        >
          suaviusatelier.com
        </div>
      </div>
    ),
    { ...size },
  )
}
