'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// A single personalization choice attached to a cart line. The `priceModifier` here is
// advisory (for live display only) — the checkout endpoint recomputes the authoritative
// price server-side from the pinned option / product override and never trusts this value.
// Populated by the product page; absent on plain (non-personalized) lines.
export type CartPersonalization = {
  optionId: number
  label: string
  inputType: 'text' | 'textarea' | 'choice' | 'color' | 'file'
  // Free-text / color value, or the chosen choice's machine value.
  value?: string
  // Human-readable label of the chosen choice (for `choice` inputs).
  choiceLabel?: string
  // Reference to an uploaded file (created by the upload endpoint), for `file` inputs.
  // `filename` is the stored (hashed) R2 name; `originalName` is what the customer named it
  // and is what we show in the UI.
  fileRef?: { uploadId: number; url: string; filename: string; originalName: string }
  priceModifier: number
}

export type CartItem = {
  productId: number
  variantSku: string
  // Stable per-line identity = productId + variantSku + a hash of the personalization.
  // Two lines of the same variant with different engraving are distinct lines; identical
  // personalization merges. Computed by `makeLineId` at add time and stored for React keys
  // and store operations.
  lineId: string
  quantity: number
  snapshot: {
    title: string
    slug: string
    price: number
    imageUrl: string | null
    currency: string
    variantName: string
    stock: number
  }
  personalization?: CartPersonalization[]
}

/**
 * Canonical signature of a line's personalization — order-independent, only the fields that
 * make two selections genuinely different. Empty string for a plain line.
 */
export function personalizationSignature(p?: CartPersonalization[]): string {
  if (!p || p.length === 0) return ''
  const norm = p
    .map((x) => ({
      o: x.optionId,
      v: x.value ?? '',
      c: x.choiceLabel ?? '',
      f: x.fileRef?.uploadId ?? '',
    }))
    .sort((a, b) => a.o - b.o)
  return JSON.stringify(norm)
}

export const makeLineId = (item: Pick<CartItem, 'productId' | 'variantSku' | 'personalization'>) =>
  `${item.productId}::${item.variantSku}::${personalizationSignature(item.personalization)}`

/** Sum of a line's personalization price modifiers (per unit). 0 for a plain line. */
export const linePersonalizationTotal = (item: CartItem) =>
  item.personalization?.reduce((sum, p) => sum + (p.priceModifier || 0), 0) ?? 0

/** Per-unit price of a line = base variant price + the sum of its personalization modifiers. */
export const lineUnitPrice = (item: CartItem) =>
  item.snapshot.price + linePersonalizationTotal(item)

// Stock is per variant, shared across all (differently personalized) lines of that variant.
const variantConsumedExcept = (
  items: CartItem[],
  productId: number,
  variantSku: string,
  exceptLineId: string,
) =>
  items
    .filter(
      (i) => i.productId === productId && i.variantSku === variantSku && i.lineId !== exceptLineId,
    )
    .reduce((sum, i) => sum + i.quantity, 0)

/** Total units of a given variant currently in the cart (across all its lines). */
export const variantQuantityInCart = (items: CartItem[], productId: number, variantSku: string) =>
  items
    .filter((i) => i.productId === productId && i.variantSku === variantSku)
    .reduce((sum, i) => sum + i.quantity, 0)

type CartState = {
  items: CartItem[]
  isOpen: boolean
  add: (item: Omit<CartItem, 'quantity' | 'lineId'>, quantity?: number) => void
  remove: (lineId: string) => void
  updateQuantity: (lineId: string, quantity: number) => void
  clear: () => void
  open: () => void
  close: () => void
  toggle: () => void
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      add: (item, quantity = 1) =>
        set((state) => {
          const lineId = makeLineId(item)
          const stock = item.snapshot.stock
          // Room left for this variant, accounting for its other (differently personalized) lines.
          const room = Math.max(0, stock - variantConsumedExcept(state.items, item.productId, item.variantSku, lineId))
          const existing = state.items.find((i) => i.lineId === lineId)
          if (existing) {
            const nextQty = Math.min(existing.quantity + quantity, room)
            return {
              items: state.items.map((i) =>
                i.lineId === lineId ? { ...i, quantity: nextQty, snapshot: { ...i.snapshot, stock } } : i,
              ),
              isOpen: true,
            }
          }
          if (room <= 0) return { isOpen: true }
          return {
            items: [...state.items, { ...item, lineId, quantity: Math.min(quantity, room) }],
            isOpen: true,
          }
        }),
      remove: (lineId) =>
        set((state) => ({ items: state.items.filter((i) => i.lineId !== lineId) })),
      updateQuantity: (lineId, quantity) =>
        set((state) => {
          if (quantity <= 0) return { items: state.items.filter((i) => i.lineId !== lineId) }
          return {
            items: state.items.map((i) => {
              if (i.lineId !== lineId) return i
              const room = Math.max(
                0,
                i.snapshot.stock - variantConsumedExcept(state.items, i.productId, i.variantSku, lineId),
              )
              return { ...i, quantity: Math.min(quantity, room) }
            }),
          }
        }),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'suavius-cart',
      // v4: lines gained `lineId` + optional `personalization` (Phase 3). Older persisted
      // lines are re-keyed below rather than discarded.
      version: 4,
      partialize: (state) => ({ items: state.items }),
      migrate: (persisted) => {
        const ps = persisted as { items?: unknown[] } | undefined
        if (!ps?.items) return { items: [] }
        const items = ps.items
          .filter((i): i is Record<string, unknown> => typeof i === 'object' && i !== null)
          .filter((i) => typeof i.variantSku === 'string')
          .filter((i) => {
            const snap = i.snapshot
            return (
              typeof snap === 'object' &&
              snap !== null &&
              typeof (snap as Record<string, unknown>).stock === 'number'
            )
          })
          .map((i) => {
            const item = i as unknown as CartItem
            // Recompute a stable lineId (pre-v4 lines had none).
            return { ...item, lineId: makeLineId(item) }
          })
        return { items }
      },
    }
  )
)

export const cartTotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + lineUnitPrice(i) * i.quantity, 0)

/** Subtotal of the base product prices only (excludes personalization surcharges). */
export const cartProductSubtotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.snapshot.price * i.quantity, 0)

/** Subtotal of personalization surcharges only across the whole cart. */
export const cartPersonalizationSubtotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + linePersonalizationTotal(i) * i.quantity, 0)

export const cartItemCount = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.quantity, 0)
