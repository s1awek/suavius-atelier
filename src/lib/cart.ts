'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  productId: number
  variantSku: string
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
}

export const cartKey = (productId: number, variantSku: string) =>
  `${productId}::${variantSku}`

type CartState = {
  items: CartItem[]
  isOpen: boolean
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  remove: (productId: number, variantSku: string) => void
  updateQuantity: (productId: number, variantSku: string, quantity: number) => void
  clear: () => void
  open: () => void
  close: () => void
  toggle: () => void
}

const matches = (i: CartItem, productId: number, variantSku: string) =>
  i.productId === productId && i.variantSku === variantSku

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      add: (item, quantity = 1) =>
        set((state) => {
          const stock = item.snapshot.stock
          const existing = state.items.find((i) => matches(i, item.productId, item.variantSku))
          if (existing) {
            const nextQty = Math.min(existing.quantity + quantity, stock)
            return {
              items: state.items.map((i) =>
                matches(i, item.productId, item.variantSku)
                  ? { ...i, quantity: nextQty, snapshot: { ...i.snapshot, stock } }
                  : i,
              ),
              isOpen: true,
            }
          }
          return {
            items: [...state.items, { ...item, quantity: Math.min(quantity, stock) }],
            isOpen: true,
          }
        }),
      remove: (productId, variantSku) =>
        set((state) => ({
          items: state.items.filter((i) => !matches(i, productId, variantSku)),
        })),
      updateQuantity: (productId, variantSku, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => !matches(i, productId, variantSku))
              : state.items.map((i) =>
                  matches(i, productId, variantSku)
                    ? { ...i, quantity: Math.min(quantity, i.snapshot.stock) }
                    : i,
                ),
        })),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'suavius-cart',
      version: 3,
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
          }) as unknown as CartItem[]
        return { items }
      },
    }
  )
)

export const cartTotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.snapshot.price * i.quantity, 0)

export const cartItemCount = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.quantity, 0)
