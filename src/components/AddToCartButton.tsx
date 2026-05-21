'use client'

import { useCart } from '@/lib/cart'

type Props = {
  productId: number
  title: string
  slug: string
  price: number
  imageUrl: string | null
  currency?: string
}

export function AddToCartButton({
  productId,
  title,
  slug,
  price,
  imageUrl,
  currency = 'EUR',
}: Props) {
  const add = useCart((s) => s.add)

  return (
    <button
      type="button"
      onClick={() =>
        add({
          productId,
          snapshot: { title, slug, price, imageUrl, currency },
        })
      }
      className="mt-10 w-full px-6 py-4 bg-dark text-warm hover:bg-copper transition-colors text-sm tracking-wide cursor-pointer"
    >
      Add to cart
    </button>
  )
}
