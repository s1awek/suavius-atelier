import Link from 'next/link'
import { getStripe } from '@/lib/stripe'
import { formatPrice } from '@/lib/payload'
import { ClearCartOnMount } from './ClearCartOnMount'

type SearchParams = { session_id?: string }

export const metadata = {
  title: 'Order confirmation',
}

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { session_id: sessionId } = await searchParams

  if (!sessionId) {
    return (
      <section className="max-w-2xl mx-auto px-6 py-24 text-center">
        <h1 className="font-display text-4xl">Order confirmation</h1>
        <p className="mt-4 text-ink-muted">No session id provided.</p>
        <Link
          href="/"
          className="mt-8 inline-block px-6 py-3 bg-dark text-warm hover:bg-copper transition-colors text-sm"
        >
          Back to shop
        </Link>
      </section>
    )
  }

  const session = await getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ['line_items'],
  })

  const isPaid = session.payment_status === 'paid'
  const email = session.customer_details?.email ?? null

  return (
    <section className="max-w-2xl mx-auto px-6 py-24">
      <ClearCartOnMount />
      <h1 className="font-display text-4xl">
        {isPaid ? 'Thank you for your order' : 'Order received'}
      </h1>
      <p className="mt-4 text-ink-muted">
        {isPaid
          ? 'We received your payment and will start preparing your order shortly.'
          : 'Your payment is processing. You will get an email confirmation once it completes.'}
      </p>
      {email && (
        <p className="mt-2 text-sm text-ink-muted">
          A confirmation will be sent to <strong>{email}</strong>.
        </p>
      )}

      {session.line_items?.data && session.line_items.data.length > 0 && (
        <div className="mt-12 border-t border-warm-mid pt-8">
          <h2 className="font-display text-2xl">Items</h2>
          <ul className="mt-6 space-y-4">
            {session.line_items.data.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.quantity} × {item.description}
                </span>
                <span>
                  {formatPrice(item.amount_total, (session.currency ?? 'eur').toUpperCase())}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-6 pt-4 border-t border-warm-mid flex justify-between text-sm font-medium">
            <span>Total</span>
            <span>
              {formatPrice(session.amount_total ?? 0, (session.currency ?? 'eur').toUpperCase())}
            </span>
          </div>
        </div>
      )}

      <Link
        href="/products"
        className="mt-12 inline-block px-6 py-3 bg-dark text-warm hover:bg-copper transition-colors text-sm"
      >
        Continue shopping
      </Link>
    </section>
  )
}
