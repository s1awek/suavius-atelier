import Link from 'next/link'
import Image from 'next/image'
import type { Product, Media } from '@/payload-types'
import { formatPrice } from '@/lib/payload'
import { ProductBadges } from './ProductBadges'

function productImages(product: Product): Media[] {
  return (product.images ?? [])
    .map((i) => i.image)
    .filter((m): m is Media => typeof m === 'object' && m !== null && !!m.url)
}

/** First image is the cut-out product shot; the reverse (or a second view) shows on hover. */
function getImages(product: Product): { cover: Media | null; alt: Media | null } {
  const images = productImages(product)
  const cover = images[0] ?? null
  const pick = (part: string) => images.find((m, i) => i > 0 && m.filename?.includes(part))
  const alt = pick('reverse-1') ?? pick('reverse') ?? pick('view-2') ?? null
  return { cover, alt }
}

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product
  priority?: boolean
}) {
  const { cover, alt } = getImages(product)
  const onSale =
    typeof product.compareAtPrice === 'number' && product.compareAtPrice > product.price

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="aspect-square bg-warm-mid/60 overflow-hidden mb-4 relative">
        {cover && cover.url ? (
          <Image
            src={cover.url}
            alt={cover.alt ?? product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
            className="object-contain p-[9%] transition-transform duration-500 group-hover:scale-[1.03]"
            priority={priority}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-muted text-xs">
            [no image]
          </div>
        )}
        {alt?.url && (
          <Image
            src={alt.url}
            alt=""
            aria-hidden="true"
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
            className="object-contain p-[9%] bg-warm-mid opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100 hidden [@media(hover:hover)]:block"
          />
        )}
      </div>
      <ProductBadges product={product} className="block mb-1" />
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <h3 className="text-lg md:text-xl text-dark leading-snug group-hover:text-copper transition-colors">
          {product.title}
        </h3>
        <p className="text-base whitespace-nowrap">
          {onSale && (
            <span className="line-through text-ink-muted mr-2">
              {formatPrice(product.compareAtPrice!)}
            </span>
          )}
          <span className="text-ink">{formatPrice(product.price)}</span>
        </p>
      </div>
    </Link>
  )
}
