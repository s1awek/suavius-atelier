import { ImageResponse } from 'next/og'
import { getPayloadClient, formatPrice } from '@/lib/payload'

export const alt = 'Suavius Atelier product'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function ProductOGImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'products',
    where: {
      and: [{ slug: { equals: slug } }, { status: { equals: 'active' } }],
    },
    limit: 1,
    depth: 2,
  })
  const product = result.docs[0]

  if (!product) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#f5f0e8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 64,
            color: '#1a1714',
            fontFamily: 'Georgia, serif',
          }}
        >
          Suavius Atelier
        </div>
      ),
      { ...size },
    )
  }

  const firstImage =
    product.images?.[0]?.image && typeof product.images[0].image === 'object'
      ? product.images[0].image
      : null
  const imageUrl = firstImage?.url ?? null

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#f5f0e8',
          display: 'flex',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div
          style={{
            width: '50%',
            height: '100%',
            background: '#e8e0d0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={product.title}
              width={630}
              height={630}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          ) : (
            <div style={{ fontSize: 32, color: '#8c7b6b' }}>Suavius Atelier</div>
          )}
        </div>
        <div
          style={{
            width: '50%',
            height: '100%',
            padding: '64px 56px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 20,
                textTransform: 'uppercase',
                letterSpacing: '0.3em',
                color: '#b87333',
                marginBottom: 28,
              }}
            >
              Suavius Atelier
            </div>
            <div
              style={{
                fontSize: 56,
                color: '#1a1714',
                lineHeight: 1.1,
              }}
            >
              {product.title}
            </div>
          </div>
          <div
            style={{
              fontSize: 40,
              color: '#1a1714',
              borderTop: '1px solid #d4c5b0',
              paddingTop: 24,
            }}
          >
            {formatPrice(product.price)}
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
