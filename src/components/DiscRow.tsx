import Image from 'next/image'
import type { Media, Product } from '@/payload-types'

/** The cut-out front shot of a product (its first image), if it has one. */
export function frontImage(product: Product): Media | null {
  const first = product.images?.[0]?.image
  return typeof first === 'object' && first?.url ? first : null
}

/**
 * A collection shown by its own pieces: the real front shots side by side on the
 * same stone tile the shop cards use, in one even row. Used instead of mood images, so a collection only
 * ever shows boards that exist.
 */
export function DiscRow({
  products,
  sizes,
  priority = false,
  className = '',
}: {
  products: Product[]
  sizes: string
  priority?: boolean
  className?: string
}) {
  const fronts = products
    .map((p) => ({ product: p, image: frontImage(p) }))
    .filter((f): f is { product: Product; image: Media } => f.image !== null)
    .slice(0, 3)
  if (fronts.length === 0) return <div className={`bg-warm-mid ${className}`} />

  // One disc fills most of the tile; more discs share the width evenly with a slight overlap.
  const width = fronts.length === 1 ? '62%' : fronts.length === 2 ? '46%' : '36%'

  return (
    <div className={`relative bg-warm-mid flex items-center justify-center overflow-hidden ${className}`}>
      {fronts.map(({ product, image }, i) => (
        <div
          key={product.id}
          className="relative aspect-square"
          style={{ width, marginLeft: i === 0 ? 0 : '-4%' }}
        >
          <Image
            src={image.url!}
            alt={image.alt ?? product.title}
            fill
            sizes={sizes}
            priority={priority && i === 0}
            className="object-contain drop-shadow-[0_14px_22px_rgba(6,7,7,0.22)]"
          />
        </div>
      ))}
    </div>
  )
}
