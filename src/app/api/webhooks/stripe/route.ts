import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { getPayloadClient } from '@/lib/payload'
import { sendOrderConfirmation } from '@/lib/email'

export const runtime = 'nodejs'

type SnapshotItem = {
  productId: number
  variantSku?: string
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
    console.warn(`[stripe webhook] rejected: ${message}`)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    await handleCheckoutCompleted(session)
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const expectedSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const sessionSiteUrl = session.metadata?.siteUrl
  if (expectedSiteUrl && sessionSiteUrl && sessionSiteUrl !== expectedSiteUrl) {
    console.log(
      `[stripe webhook] ignoring session ${session.id}: siteUrl=${sessionSiteUrl} != ${expectedSiteUrl}`,
    )
    return
  }

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
  const shippingCost = session.shipping_cost?.amount_total ?? 0
  const taxAmount = session.total_details?.amount_tax ?? 0
  const customerVatId = customer?.tax_ids?.[0]?.value ?? null

  let shippingZone: string | null = null
  const shippingRateRef = session.shipping_cost?.shipping_rate
  if (shippingRateRef) {
    try {
      const rateId = typeof shippingRateRef === 'string' ? shippingRateRef : shippingRateRef.id
      const rate = await getStripe().shippingRates.retrieve(rateId)
      shippingZone = rate.metadata?.zoneName ?? rate.display_name ?? null
    } catch (err) {
      console.error('[stripe webhook] failed to retrieve shipping rate', err)
    }
  }

  let promoCode: string | null = null
  const discountAmount = session.total_details?.amount_discount ?? 0
  if (discountAmount > 0) {
    try {
      const expanded = await getStripe().checkout.sessions.retrieve(session.id, {
        expand: ['discounts.promotion_code'],
      })
      const first = expanded.discounts?.[0]
      const promo = first?.promotion_code
      if (promo && typeof promo === 'object' && 'code' in promo) {
        promoCode = promo.code ?? null
      }
    } catch (err) {
      console.error('[stripe webhook] failed to retrieve discount info', err)
    }
  }

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
        variantSku: s.variantSku,
        quantity: s.quantity,
        priceAtPurchase: s.price,
      })),
      totalAtPurchase,
      currency,
      shippingCost,
      taxAmount,
      ...(shippingZone ? { shippingZone } : {}),
      ...(customerVatId ? { customerVatId } : {}),
      ...(promoCode ? { promoCode } : {}),
      ...(discountAmount > 0 ? { discountAmount } : {}),
    },
  })

  try {
    await decrementStock(payload, snapshot)
  } catch (err) {
    console.error('[stripe webhook] stock decrement failed', err)
  }

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

async function decrementStock(
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  snapshot: SnapshotItem[],
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (payload.db as any).drizzle

  for (const line of snapshot) {
    if (!line.variantSku || !Number.isFinite(line.quantity) || line.quantity <= 0) continue

    try {
      // Atomic decrement: only succeeds if there is enough stock.
      // Postgres locks the row during UPDATE, so concurrent webhooks serialize.
      const strict = await db.execute(sql`
        UPDATE products_variants
        SET stock = stock - ${line.quantity}::numeric
        WHERE sku = ${line.variantSku} AND stock >= ${line.quantity}::numeric
        RETURNING stock
      `)

      if (strict.rowCount === 0) {
        // Either the SKU does not exist or there was not enough stock.
        // Verify which case and, if a row exists, clamp to 0 atomically.
        const clamp = await db.execute(sql`
          UPDATE products_variants
          SET stock = 0
          WHERE sku = ${line.variantSku} AND stock > 0
          RETURNING stock
        `)
        if (clamp.rowCount === 0) {
          console.warn(
            `[stripe webhook] stock decrement found no row or already zero for sku ${line.variantSku} (product ${line.productId})`,
          )
        } else {
          console.warn(
            `[stripe webhook] oversold sku ${line.variantSku} (product ${line.productId}): asked ${line.quantity}, clamped to 0`,
          )
        }
      }
    } catch (err) {
      console.error(
        `[stripe webhook] failed to decrement stock for sku ${line.variantSku}`,
        err,
      )
    }
  }
}
