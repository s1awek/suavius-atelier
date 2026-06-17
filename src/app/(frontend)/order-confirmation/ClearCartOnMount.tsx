'use client'

import { useEffect } from 'react'
import { useCart } from '@/lib/cart'
import { track } from '@vercel/analytics'

type Props = {
  sessionId: string
  value?: number
  currency?: string
  isPaid: boolean
}

export function ClearCartOnMount({ sessionId, value, currency, isPaid }: Props) {
  const clear = useCart((s) => s.clear)
  useEffect(() => {
    clear()
    if (!isPaid) return
    // Fire `purchase` once per session - a confirmation-page refresh must not double-count.
    const key = `purchase_tracked_${sessionId}`
    try {
      if (localStorage.getItem(key)) return
      localStorage.setItem(key, '1')
    } catch {
      // localStorage unavailable (private mode etc.) - still track, just without dedupe.
    }
    track('purchase', {
      sessionId,
      value: value ?? 0,
      currency: currency ?? 'EUR',
    })
  }, [clear, isPaid, sessionId, value, currency])
  return null
}
