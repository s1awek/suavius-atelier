import Link from 'next/link'
import { formatPrice } from '@/lib/format'

// Handling (dispatch) time, NOT delivery - independent of destination country. Placeholder
// until the real cadence is known; when set, promote to an owner-editable Settings field
// (and per-product override for made-to-order pieces).
const DISPATCH_ESTIMATE = 'typically dispatched in 2-5 business days'

type Props = {
  /** Cheapest configured shipping rate (minor units), or null if none configured. */
  shippingFrom: number | null
  currency?: string
}

/**
 * Trust + shipping transparency block under the buy panel: who makes it, that it ships from
 * Poland, the dispatch window, a "from" shipping floor (full cost resolved at Stripe checkout),
 * and a returns link. Reassurance before checkout reduces abandonment for a premium brand.
 */
export function TrustShippingNote({ shippingFrom, currency = 'EUR' }: Props) {
  return (
    <div className="mt-6 space-y-1.5 text-sm text-ink-muted">
      <p>Handcrafted in Poland · made in small batches</p>
      <p>
        Ships from Poland · {DISPATCH_ESTIMATE}
        {shippingFrom != null ? ` · shipping from ${formatPrice(shippingFrom, currency)}` : ''}
      </p>
      <p>
        <Link href="/shipping-returns" className="underline hover:text-copper">
          Shipping &amp; 14-day returns
        </Link>
      </p>
    </div>
  )
}
