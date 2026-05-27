'use client'

import { useCart, cartItemCount } from '@/lib/cart'
import { useEffect, useState } from 'react'

export function CartButton() {
  const items = useCart((s) => s.items)
  const open = useCart((s) => s.open)
  const [mounted, setMounted] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR hydration guard: cart count must render 0 on the server (persisted store is client-only) and update after mount
  useEffect(() => setMounted(true), [])

  const count = mounted ? cartItemCount(items) : 0

  return (
    <button
      type="button"
      onClick={open}
      className="relative inline-flex items-center hover:text-copper transition-colors cursor-pointer p-1 -m-1"
      aria-label={`Cart (${count} items)`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-medium bg-copper text-warm rounded-full leading-none">
          {count}
        </span>
      )}
    </button>
  )
}
