'use client'

import { useCallback, useEffect, useState } from 'react'
import { AddToCartButton } from './AddToCartButton'
import { PaymentBadges } from './PaymentBadges'
import { StockAlertDialog } from './StockAlertDialog'
import { PersonalizationFields, type PdpPersonalization, type PersonalizationState } from './PersonalizationFields'
import { useCart, variantQuantityInCart } from '@/lib/cart'
import { formatPrice } from '@/lib/format'

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
  personalizations?: PdpPersonalization[]
}

const EMPTY_PERSONALIZATION: PersonalizationState = {
  personalizations: [],
  valid: true,
  priceDelta: 0,
}

export function ProductPurchasePanel({
  productId,
  title,
  slug,
  price,
  imageUrl,
  currency = 'EUR',
  variants,
  personalizations = [],
}: Props) {
  const [selectedSku, setSelectedSku] = useState<string>(variants[0]?.sku ?? '')
  const [quantity, setQuantity] = useState(1)
  const [pState, setPState] = useState<PersonalizationState>(EMPTY_PERSONALIZATION)
  const selected = variants.find((v) => v.sku === selectedSku) ?? variants[0]

  const handlePersonalizationChange = useCallback((s: PersonalizationState) => setPState(s), [])

  const items = useCart((s) => s.items)
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR hydration guard: cart state is client-only, so reconcile after mount
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

  const cartQuantity = mounted ? variantQuantityInCart(items, productId, selected.sku) : 0
  const remaining = Math.max(0, selected.stock - cartQuantity)
  const showSelector = variants.length > 1
  const outOfStock = selected.stock <= 0
  const atLimit = !outOfStock && remaining <= 0
  const maxQuantity = Math.max(1, remaining)
  const effectiveQuantity = Math.min(quantity, maxQuantity)

  const unitPrice = price + pState.priceDelta
  const hasPersonalization = personalizations.length > 0
  // Block add-to-cart only on a genuine validation miss (required unfilled, over-limit, upload
  // in-flight/failed) — plain products and fully-valid personalization both pass.
  const personalizationBlocks = hasPersonalization && !pState.valid
  // Can the customer actually add to cart right now? Out-of-stock and stock-limit-reached both
  // swap the CTA for the waitlist instead of a dead disabled button.
  const purchasable = !outOfStock && !atLimit

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
                  onClick={() => {
                    setSelectedSku(v.sku)
                    setQuantity(1)
                  }}
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

      {!outOfStock && !atLimit && (
        <div className="mt-8">
          <p className="text-xs uppercase tracking-wider text-ink-muted mb-3">Quantity</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={effectiveQuantity <= 1}
              className="w-10 h-10 border border-warm-mid hover:border-dark transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-warm-mid"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="text-base w-8 text-center tabular-nums" aria-live="polite">
              {effectiveQuantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
              disabled={effectiveQuantity >= maxQuantity}
              className="w-10 h-10 border border-warm-mid hover:border-dark transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-warm-mid"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
      )}

      {hasPersonalization && purchasable && (
        <PersonalizationFields
          productId={productId}
          options={personalizations}
          onChange={handlePersonalizationChange}
        />
      )}

      {purchasable && (
        <>
          {hasPersonalization && pState.priceDelta > 0 && (
            <div className="mt-6 space-y-2.5 border-t border-warm-mid pt-4 text-sm">
              <div className="flex justify-between text-ink-muted">
                <span>Product</span>
                <span>{formatPrice(price, currency)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Personalization</span>
                <span>+{formatPrice(pState.priceDelta, currency)}</span>
              </div>
              <div className="flex justify-between pt-1.5">
                <span className="text-ink-muted">Item price</span>
                <span className="text-base">{formatPrice(unitPrice, currency)}</span>
              </div>
            </div>
          )}

          {/* Extra breathing room above the CTA when dense personalization fields sit right
              above it and no price breakdown separates them. */}
          <div className={hasPersonalization && pState.priceDelta === 0 ? 'pt-5' : ''}>
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
              quantity={effectiveQuantity}
              personalization={pState.personalizations}
              disabled={personalizationBlocks}
              disabledLabel="Complete personalization"
            />
          </div>
        </>
      )}

      {/* Stock-level hint only while the variant is actually purchasable — never alongside
          the "Stock limit reached" / out-of-stock states (those would contradict it). */}
      {!outOfStock && !atLimit && mounted && (
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

      {outOfStock && (
        <StockAlertDialog
          productId={productId}
          variantSku={selected.sku}
          variantName={selected.name}
          reason="out-of-stock"
        />
      )}

      {atLimit && (
        <StockAlertDialog
          productId={productId}
          variantSku={selected.sku}
          variantName={selected.name}
          reason="at-limit"
        />
      )}

      <div className="mt-6 pt-6 border-t border-warm-mid">
        <PaymentBadges variant="pdp" />
      </div>
    </div>
  )
}
