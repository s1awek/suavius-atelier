import Link from 'next/link'
import Image from 'next/image'
import type { Product, Media } from '@/payload-types'
import { formatPrice } from '@/lib/payload'
import { ProductBadges } from './ProductBadges'

function getCoverImage(product: Product): Media | null {
  const first = product.images?.[0]?.image
  if (!first) return null
  return typeof first === 'object' ? first : null
}

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product
  priority?: boolean
}) {
  const cover = getCoverImage(product)
  const onSale =
    typeof product.compareAtPrice === 'number' && product.compareAtPrice > product.price

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="aspect-square bg-warm-mid overflow-hidden mb-4 relative rounded-md">
        {cover && cover.url ? (
          <Image
            src={cover.url}
            alt={cover.alt ?? product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            priority={priority}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-muted text-xs">
            [no image]
          </div>
        )}
      </div>
      <ProductBadges product={product} className="block mb-2" />
      <h3 className="font-display text-xl text-dark group-hover:text-copper transition-colors">
        {product.title}
      </h3>
      <div className="mt-1 text-sm">
        {onSale && (
          <span className="line-through text-ink-muted mr-2">
            {formatPrice(product.compareAtPrice!)}
          </span>
        )}
        <span className="text-ink">{formatPrice(product.price)}</span>
      </div>
    </Link>
  )
}
