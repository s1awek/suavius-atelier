'use client'

import { useEffect } from 'react'
import { track } from '@vercel/analytics'

type Props = {
  productId: number
  slug: string
  title: string
  /** Minor units (cents) - normalised to a major-unit `value` to match other funnel events. */
  price: number
  currency: string
  category?: string | null
}

/**
 * Fires the `view_item` funnel event once per product view (analytics is gated behind
 * consent upstream by AnalyticsGate). Completes the funnel: view_item -> add_to_cart ->
 * begin_checkout -> purchase. Render once on the PDP.
 */
export function ViewItemTracker({ productId, slug, title, price, currency, category }: Props) {
  useEffect(() => {
    track('view_item', {
      productId,
      slug,
      title,
      value: price / 100,
      currency,
      ...(category ? { category } : {}),
    })
  }, [productId, slug, title, price, currency, category])
  return null
}
