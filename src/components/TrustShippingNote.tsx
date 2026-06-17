import Link from 'next/link'
import { formatPrice } from '@/lib/format'

type Props = {
  /** Cheapest configured shipping rate (minor units), or null if none configured. */
  shippingFrom: number | null
  currency?: string
}

/**
 * Trust + shipping transparency block under the buy panel: who makes it, that it ships from
 * Poland, a "from" shipping floor (full cost resolved at Stripe checkout), and an honest
 * dispatch note (ready vs made-to-order) linking to the full Shipping & returns policy.
 * We intentionally avoid promising a fixed dispatch window: made-to-order / personalized
 * pieces vary widely by customization. Reassurance before checkout reduces abandonment.
 */
export function TrustShippingNote({ shippingFrom, currency = 'EUR' }: Props) {
  return (
    <div className="mt-6 space-y-1.5 text-sm text-ink-muted">
      <p>Handcrafted in Poland · made in small batches</p>
      <p>
        Ships from Poland
        {shippingFrom != null ? ` · shipping from ${formatPrice(shippingFrom, currency)}` : ''}
      </p>
      <p>
        Ready pieces dispatch within a few business days; made-to-order and personalized pieces
        take longer.{' '}
        <Link href="/shipping-returns" className="underline hover:text-copper">
          Shipping &amp; returns
        </Link>
      </p>
    </div>
  )
}
