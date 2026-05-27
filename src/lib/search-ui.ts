'use client'

import { create } from 'zustand'

/**
 * Open/close state for the global search overlay. Mirrors the cart store pattern
 * (useCart) so the trigger button can live in several places (desktop nav,
 * mobile bar) while a single overlay instance reads the shared state.
 */
type SearchUIState = {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const useSearchUI = create<SearchUIState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))
