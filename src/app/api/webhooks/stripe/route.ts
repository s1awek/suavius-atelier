import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { getPayloadClient } from '@/lib/payload'

export const runtime = 'nodejs'

type SnapshotItem = {
  productId: number
  title: string
  price: number
  quantity: number
}

export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    await handleCheckoutCompleted(session)
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id

  if (!paymentIntentId) {
    console.error('[stripe webhook] no payment_intent on session', session.id)
    return
  }

  const payload = await getPayloadClient()

  const existing = await payload.find({
    collection: 'orders',
    where: { stripePaymentIntentId: { equals: paymentIntentId } },
    limit: 1,
  })
  if (existing.docs.length > 0) {
    return
  }

  const snapshotRaw = session.metadata?.itemsSnapshot
  if (!snapshotRaw) {
    console.error('[stripe webhook] missing itemsSnapshot metadata on session', session.id)
    return
  }

  let snapshot: SnapshotItem[]
  try {
    snapshot = JSON.parse(snapshotRaw) as SnapshotItem[]
  } catch {
    console.error('[stripe webhook] invalid itemsSnapshot JSON', session.id)
    return
  }

  const customer = session.customer_details
  const shipping = session.collected_information?.shipping_details ?? null
  const address = shipping?.address ?? customer?.address ?? null

  await payload.create({
    collection: 'orders',
    data: {
      stripePaymentIntentId: paymentIntentId,
      status: 'paid',
      customer: {
        email: customer?.email ?? 'unknown@example.com',
        name: shipping?.name ?? customer?.name ?? '',
        address: {
          line1: address?.line1 ?? '',
          line2: address?.line2 ?? undefined,
          city: address?.city ?? '',
          postalCode: address?.postal_code ?? '',
          country: address?.country ?? '',
        },
      },
      items: snapshot.map((s) => ({
        product: s.productId,
        quantity: s.quantity,
        priceAtPurchase: s.price,
      })),
      totalAtPurchase: session.amount_total ?? 0,
      currency: (session.currency ?? 'eur').toUpperCase(),
    },
  })
}
