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
    if (isPaid) {
      track('purchase', {
        sessionId,
        value: value ?? 0,
        currency: currency ?? 'EUR',
      })
    }
  }, [clear, isPaid, sessionId, value, currency])
  return null
}
