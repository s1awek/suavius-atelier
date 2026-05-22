'use client'

import { useEffect, useState } from 'react'
import { AddToCartButton } from './AddToCartButton'
import { PaymentBadges } from './PaymentBadges'
import { useCart } from '@/lib/cart'

type Variant = {
  name: string
  sku: string
  stock: number
}

type Props = {
  productId: number
  title: string
  slug: string
  price: number
  imageUrl: string | null
  currency?: string
  variants: Variant[]
}

const CONTACT_EMAIL = 'orders@suaviusatelier.com'

export function ProductPurchasePanel({
  productId,
  title,
  slug,
  price,
  imageUrl,
  currency = 'EUR',
  variants,
}: Props) {
  const [selectedSku, setSelectedSku] = useState<string>(variants[0]?.sku ?? '')
  const selected = variants.find((v) => v.sku === selectedSku) ?? variants[0]

  const items = useCart((s) => s.items)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!selected) {
    return (
      <button
        type="button"
        disabled
        className="mt-10 w-full px-6 py-4 bg-dark text-warm opacity-50 cursor-not-allowed text-sm tracking-wide"
      >
        Unavailable
      </button>
    )
  }

  const cartQuantity = mounted
    ? items.find((i) => i.productId === productId && i.variantSku === selected.sku)?.quantity ?? 0
    : 0
  const remaining = Math.max(0, selected.stock - cartQuantity)
  const showSelector = variants.length > 1
  const outOfStock = selected.stock <= 0
  const atLimit = !outOfStock && remaining <= 0

  return (
    <div>
      {showSelector && (
        <div className="mt-8">
          <p className="text-xs uppercase tracking-wider text-ink-muted mb-3">Option</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const isSelected = v.sku === selectedSku
              const vOut = v.stock <= 0
              return (
                <button
                  key={v.sku}
                  type="button"
                  onClick={() => setSelectedSku(v.sku)}
                  disabled={vOut}
                  className={[
                    'px-4 py-2 text-sm border transition-colors cursor-pointer',
                    isSelected
                      ? 'border-dark bg-dark text-warm'
                      : 'border-warm-mid hover:border-dark',
                    vOut ? 'opacity-40 cursor-not-allowed line-through' : '',
                  ].join(' ')}
                  aria-pressed={isSelected}
                >
                  {v.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <AddToCartButton
        productId={productId}
        title={title}
        slug={slug}
        price={price}
        imageUrl={imageUrl}
        currency={currency}
        variantSku={selected.sku}
        variantName={selected.name}
        stock={selected.stock}
        disabled={outOfStock || atLimit}
        disabledLabel={outOfStock ? 'Out of stock' : 'Stock limit reached'}
      />

      {!outOfStock && mounted && (
        <p
          className={`text-xs mt-3 ${
            selected.stock <= 3 ? 'text-copper' : 'text-ink-muted'
          }`}
        >
          {selected.stock <= 3
            ? 'Almost gone - order soon'
            : selected.stock <= 9
              ? 'Low stock'
              : 'In stock'}
        </p>
      )}

      {(outOfStock || atLimit) && (
        <p className="text-xs text-ink-muted mt-3 leading-relaxed">
          Need more?{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-copper">
            Email us
          </a>{' '}
          and we will make a small batch for you.
        </p>
      )}

      <div className="mt-6 pt-6 border-t border-warm-mid">
        <PaymentBadges variant="pdp" />
      </div>
    </div>
  )
}
