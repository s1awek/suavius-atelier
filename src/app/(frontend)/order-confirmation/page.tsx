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
        <h1 className="font-display text-4xl md:text-5xl text-dark">Order confirmation</h1>
        <p className="mt-4 text-ink">No session id provided.</p>
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
  const currency = (session.currency ?? 'eur').toUpperCase()
  // Tax is inclusive (line + shipping prices already contain VAT), so we surface it as a
  // note rather than an added line. Shipping is what turns the line subtotal into the total.
  const shippingAmount = session.total_details?.amount_shipping ?? 0
  const taxAmount = session.total_details?.amount_tax ?? 0
  const discountAmount = session.total_details?.amount_discount ?? 0

  return (
    <section className="max-w-2xl mx-auto px-6 py-24">
      <ClearCartOnMount
        sessionId={sessionId}
        value={(session.amount_total ?? 0) / 100}
        currency={currency}
        isPaid={isPaid}
      />
      <h1 className="font-display text-4xl md:text-5xl text-dark">
        {isPaid ? 'Thank you for your order' : 'Order received'}
      </h1>
      <p className="mt-4 text-ink">
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
          <h2 className="font-display text-2xl text-dark">Items</h2>
          <ul className="mt-6 space-y-4">
            {session.line_items.data.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.quantity} × {item.description}
                </span>
                <span>{formatPrice(item.amount_total, currency)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 pt-4 border-t border-warm-mid space-y-2 text-sm">
            <div className="flex justify-between text-ink-muted">
              <span>Subtotal</span>
              <span>{formatPrice(session.amount_subtotal ?? 0, currency)}</span>
            </div>
            {shippingAmount > 0 && (
              <div className="flex justify-between text-ink-muted">
                <span>Shipping</span>
                <span>{formatPrice(shippingAmount, currency)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-ink-muted">
                <span>Discount</span>
                <span>−{formatPrice(discountAmount, currency)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-warm-mid font-medium text-dark">
              <span>Total</span>
              <span>{formatPrice(session.amount_total ?? 0, currency)}</span>
            </div>
            {taxAmount > 0 && (
              <p className="pt-1 text-xs text-ink-muted">
                Includes {formatPrice(taxAmount, currency)} VAT. Shipping calculated at checkout.
              </p>
            )}
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
