import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { getPayloadClient } from '@/lib/payload'
import { sendOrderConfirmation } from '@/lib/email'

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
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret)
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

  const customerEmail = customer?.email ?? 'unknown@example.com'
  const customerName = shipping?.name ?? customer?.name ?? ''
  const shippingAddress = {
    line1: address?.line1 ?? '',
    line2: address?.line2 ?? undefined,
    city: address?.city ?? '',
    postalCode: address?.postal_code ?? '',
    country: address?.country ?? '',
  }
  const totalAtPurchase = session.amount_total ?? 0
  const currency = (session.currency ?? 'eur').toUpperCase()

  const order = await payload.create({
    collection: 'orders',
    data: {
      stripePaymentIntentId: paymentIntentId,
      status: 'paid',
      customer: {
        email: customerEmail,
        name: customerName,
        address: shippingAddress,
      },
      items: snapshot.map((s) => ({
        product: s.productId,
        quantity: s.quantity,
        priceAtPurchase: s.price,
      })),
      totalAtPurchase,
      currency,
    },
  })

  try {
    const settings = await payload.findGlobal({ slug: 'settings' })
    const adminEmail = settings?.storeEmail || undefined

    await sendOrderConfirmation(
      {
        orderId: order.id,
        customerEmail,
        customerName,
        items: snapshot.map((s) => ({
          title: s.title,
          quantity: s.quantity,
          priceAtPurchase: s.price,
        })),
        total: totalAtPurchase,
        currency,
        shippingAddress,
      },
      adminEmail,
    )
  } catch (err) {
    console.error('[stripe webhook] order email failed', err)
  }
}
