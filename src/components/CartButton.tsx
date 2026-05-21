'use client'

import { useCart, cartItemCount } from '@/lib/cart'
import { useEffect, useState } from 'react'

export function CartButton() {
  const items = useCart((s) => s.items)
  const open = useCart((s) => s.open)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const count = mounted ? cartItemCount(items) : 0

  return (
    <button
      type="button"
      onClick={open}
      className="relative hover:text-copper transition-colors cursor-pointer"
      aria-label={`Cart (${count} items)`}
    >
      Cart
      {count > 0 && (
        <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1 text-xs bg-copper text-warm rounded-full">
          {count}
        </span>
      )}
    </button>
  )
}
