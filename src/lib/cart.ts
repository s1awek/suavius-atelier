'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  productId: number
  quantity: number
  snapshot: {
    title: string
    slug: string
    price: number
    imageUrl: string | null
    currency: string
  }
}

type CartState = {
  items: CartItem[]
  isOpen: boolean
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  remove: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
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
          const existing = state.items.find((i) => i.productId === item.productId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i
              ),
              isOpen: true,
            }
          }
          return {
            items: [...state.items, { ...item, quantity }],
            isOpen: true,
          }
        }),
      remove: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
        })),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'suavius-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
)

export const cartTotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.snapshot.price * i.quantity, 0)

export const cartItemCount = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.quantity, 0)
