import { ImageResponse } from 'next/og'
import { imageResponseToJpeg, getCormorantFonts } from '@/lib/og'

export const alt = 'Suavius Atelier - hand-designed PCB coasters and wood accessories'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/jpeg'

export default async function OGImage() {
  const fonts = await getCormorantFonts()
  const png = new ImageResponse(
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
          fontFamily: 'Cormorant, Georgia, serif',
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
            marginTop: 56,
            display: 'flex',
            alignItems: 'center',
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 26,
              color: '#ffffff',
              background: '#b87333',
              padding: '18px 40px',
              borderRadius: 4,
              letterSpacing: '0.05em',
            }}
          >
            Shop the collection
          </div>
          <div style={{ fontSize: 22, color: '#8c7b6b' }}>suaviusatelier.com</div>
        </div>
      </div>
    ),
    { ...size, fonts },
  )
  return imageResponseToJpeg(png, 85)
}
