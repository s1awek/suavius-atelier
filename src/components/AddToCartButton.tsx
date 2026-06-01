'use client'

import { useCart } from '@/lib/cart'
import { track } from '@vercel/analytics'

type Props = {
  productId: number
  title: string
  slug: string
  price: number
  imageUrl: string | null
  currency?: string
  variantSku: string
  variantName: string
  stock: number
  quantity?: number
  disabled?: boolean
  disabledLabel?: string
  label?: string
}

export function AddToCartButton({
  productId,
  title,
  slug,
  price,
  imageUrl,
  currency = 'EUR',
  variantSku,
  variantName,
  stock,
  quantity = 1,
  disabled = false,
  disabledLabel = 'Out of stock',
  label = 'Add to cart',
}: Props) {
  const add = useCart((s) => s.add)

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        add(
          {
            productId,
            variantSku,
            snapshot: { title, slug, price, imageUrl, currency, variantName, stock },
          },
          quantity,
        )
        track('add_to_cart', {
          productId,
          variantSku,
          title,
          quantity,
          value: (price * quantity) / 100,
          currency,
        })
      }}
      className="mt-10 w-full px-6 py-4 bg-dark text-warm hover:bg-copper transition-colors text-sm tracking-wide cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-dark"
    >
      {disabled ? disabledLabel : label}
    </button>
  )
}
