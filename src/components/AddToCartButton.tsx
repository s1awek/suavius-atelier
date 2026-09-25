'use client'

import { useCart, type CartPersonalization } from '@/lib/cart'
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
  personalization?: CartPersonalization[]
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
  personalization,
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
        const modifierTotal = personalization?.reduce((s, p) => s + (p.priceModifier || 0), 0) ?? 0
        add(
          {
            productId,
            variantSku,
            snapshot: { title, slug, price, imageUrl, currency, variantName, stock },
            ...(personalization && personalization.length > 0 ? { personalization } : {}),
          },
          quantity,
        )
        track('add_to_cart', {
          productId,
          variantSku,
          title,
          quantity,
          personalized: (personalization?.length ?? 0) > 0,
          value: ((price + modifierTotal) * quantity) / 100,
          currency,
        })
      }}
      className="mt-6 md:mt-8 w-full px-6 min-h-13 bg-enig text-board font-medium hover:bg-dark hover:text-warm transition-colors text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-enig disabled:hover:text-board"
    >
      {disabled ? disabledLabel : label}
    </button>
  )
}
