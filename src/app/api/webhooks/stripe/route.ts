import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import type Stripe from 'stripe'
import type { Order, PersonalizationUpload, Product } from '@/payload-types'
import { getStripe } from '@/lib/stripe'
import { getPayloadClient } from '@/lib/payload'
import { sendOrderConfirmation, type OrderConfirmationItem } from '@/lib/email'
import { subscribeEmail } from '@/lib/newsletter'
import { CHECKOUT_CONSENT_TEXT } from '@/lib/newsletter-consent'
import { adjustStock } from '@/lib/stock'

export const runtime = 'nodejs'

type StockLine = { productId: number; variantSku?: string | null; quantity: number }

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

  const orderIdRaw = session.metadata?.orderId
  if (!orderIdRaw) {
    // TRANSITIONAL: sessions created before the draft-order rollout carry `itemsSnapshot`
    // instead of an `orderId`. Handle them the old way so no in-flight order is lost during
    // the deploy. Safe to delete once no pre-rollout sessions can still complete.
    return handleLegacySnapshot(payload, session, paymentIntentId)
  }

  const orderId = Number(orderIdRaw)
  if (!Number.isInteger(orderId)) {
    console.error('[stripe webhook] non-numeric orderId in metadata', orderIdRaw, session.id)
    return
  }

  // Fetch with depth so item products + uploaded files populate (needed for stock + email).
  let order: Order | null = null
  try {
    order = await payload.findByID({ collection: 'orders', id: orderId, depth: 2 })
  } catch {
    console.error('[stripe webhook] draft order not found', orderId, session.id)
    return
  }

  // Fast idempotency path: a duplicate delivery for an already-processed order does nothing.
  if (order.status !== 'pending') {
    return
  }

  // Atomic claim: flip pending -> paid in a single locked UPDATE. If a concurrent delivery
  // already claimed it, rowCount is 0 and we bail before decrementing stock / sending mail.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (payload.db as any).drizzle
  const claim = await db.execute(sql`
    UPDATE orders SET status = 'paid' WHERE id = ${orderId} AND status = 'pending' RETURNING id
  `)
  if (claim.rowCount === 0) {
    return
  }

  const details = extractSessionDetails(session)
  const shippingZone = await resolveShippingZone(session)
  const promo = await resolvePromo(session)

  try {
    await payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        status: 'paid',
        stripePaymentIntentId: paymentIntentId,
        customer: {
          email: details.customerEmail,
          name: details.customerName,
          address: details.shippingAddress,
        },
        totalAtPurchase: details.totalAtPurchase,
        currency: details.currency,
        shippingCost: details.shippingCost,
        taxAmount: details.taxAmount,
        ...(shippingZone ? { shippingZone } : {}),
        ...(details.customerVatId ? { customerVatId: details.customerVatId } : {}),
        ...(promo.code ? { promoCode: promo.code } : {}),
        ...(promo.discountAmount > 0 ? { discountAmount: promo.discountAmount } : {}),
      },
    })
  } catch (err) {
    console.error('[stripe webhook] failed to finalize order', orderId, err)
    return
  }

  await captureMarketingConsent(payload, session)

  const stockLines: StockLine[] = (order.items ?? []).map((i) => ({
    productId: typeof i.product === 'object' ? i.product.id : i.product,
    variantSku: i.variantSku,
    quantity: i.quantity,
  }))
  try {
    await decrementStock(payload, stockLines, String(orderId))
  } catch (err) {
    console.error('[stripe webhook] stock decrement failed', err)
  }

  try {
    const settings = await payload.findGlobal({ slug: 'settings' })
    const adminEmail = settings?.storeEmail || undefined

    await sendOrderConfirmation(
      {
        orderId,
        customerEmail: details.customerEmail,
        customerName: details.customerName,
        items: orderItemsToEmail(order.items ?? []),
        total: details.totalAtPurchase,
        currency: details.currency,
        shippingAddress: details.shippingAddress,
      },
      adminEmail,
    )
  } catch (err) {
    console.error('[stripe webhook] order email failed', err)
  }
}

function orderItemsToEmail(items: NonNullable<Order['items']>): OrderConfirmationItem[] {
  return items.map((i) => {
    const product = i.product as Product | number
    const title = typeof product === 'object' ? product.title : `Product #${product}`
    const personalizations = (i.personalizations ?? [])
      .map((p) => {
        const file = p.file
        const fileUrl =
          file && typeof file === 'object' ? (file as PersonalizationUpload).url ?? null : null
        return {
          label: p.optionLabel ?? 'Personalization',
          value: p.choiceLabel ?? p.value ?? (fileUrl ? 'Uploaded file' : ''),
          fileUrl,
        }
      })
      .filter((p) => p.value || p.fileUrl)
    return {
      title,
      quantity: i.quantity,
      priceAtPurchase: i.priceAtPurchase,
      ...(personalizations.length > 0 ? { personalizations } : {}),
    }
  })
}

type SessionDetails = {
  customerEmail: string
  customerName: string
  shippingAddress: {
    line1: string
    line2?: string
    city: string
    postalCode: string
    country: string
  }
  totalAtPurchase: number
  currency: string
  shippingCost: number
  taxAmount: number
  customerVatId: string | null
}

function extractSessionDetails(session: Stripe.Checkout.Session): SessionDetails {
  const customer = session.customer_details
  const shipping = session.collected_information?.shipping_details ?? null
  const address = shipping?.address ?? customer?.address ?? null

  return {
    customerEmail: customer?.email ?? 'unknown@example.com',
    customerName: shipping?.name ?? customer?.name ?? '',
    shippingAddress: {
      line1: address?.line1 ?? '',
      line2: address?.line2 ?? undefined,
      city: address?.city ?? '',
      postalCode: address?.postal_code ?? '',
      country: address?.country ?? '',
    },
    totalAtPurchase: session.amount_total ?? 0,
    currency: (session.currency ?? 'eur').toUpperCase(),
    shippingCost: session.shipping_cost?.amount_total ?? 0,
    taxAmount: session.total_details?.amount_tax ?? 0,
    customerVatId: customer?.tax_ids?.[0]?.value ?? null,
  }
}

async function resolveShippingZone(session: Stripe.Checkout.Session): Promise<string | null> {
  const shippingRateRef = session.shipping_cost?.shipping_rate
  if (!shippingRateRef) return null
  try {
    const rateId = typeof shippingRateRef === 'string' ? shippingRateRef : shippingRateRef.id
    const rate = await getStripe().shippingRates.retrieve(rateId)
    return rate.metadata?.zoneName ?? rate.display_name ?? null
  } catch (err) {
    console.error('[stripe webhook] failed to retrieve shipping rate', err)
    return null
  }
}

async function resolvePromo(
  session: Stripe.Checkout.Session,
): Promise<{ code: string | null; discountAmount: number }> {
  const discountAmount = session.total_details?.amount_discount ?? 0
  if (discountAmount <= 0) return { code: null, discountAmount: 0 }
  try {
    const expanded = await getStripe().checkout.sessions.retrieve(session.id, {
      expand: ['discounts.promotion_code'],
    })
    const first = expanded.discounts?.[0]
    const promo = first?.promotion_code
    if (promo && typeof promo === 'object' && 'code' in promo) {
      return { code: promo.code ?? null, discountAmount }
    }
  } catch (err) {
    console.error('[stripe webhook] failed to retrieve discount info', err)
  }
  return { code: null, discountAmount }
}

async function handleLegacySnapshot(
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  session: Stripe.Checkout.Session,
  paymentIntentId: string,
) {
  const existing = await payload.find({
    collection: 'orders',
    where: { stripePaymentIntentId: { equals: paymentIntentId } },
    limit: 1,
  })
  if (existing.docs.length > 0) return

  const snapshotRaw = session.metadata?.itemsSnapshot
  if (!snapshotRaw) {
    console.error('[stripe webhook] missing orderId and itemsSnapshot on session', session.id)
    return
  }

  type SnapshotItem = {
    productId: number
    variantSku?: string
    title: string
    price: number
    quantity: number
  }
  let snapshot: SnapshotItem[]
  try {
    snapshot = JSON.parse(snapshotRaw) as SnapshotItem[]
  } catch {
    console.error('[stripe webhook] invalid itemsSnapshot JSON', session.id)
    return
  }

  const details = extractSessionDetails(session)
  const shippingZone = await resolveShippingZone(session)
  const promo = await resolvePromo(session)

  const order = await payload.create({
    collection: 'orders',
    data: {
      stripePaymentIntentId: paymentIntentId,
      status: 'paid',
      customer: {
        email: details.customerEmail,
        name: details.customerName,
        address: details.shippingAddress,
      },
      items: snapshot.map((s) => ({
        product: s.productId,
        variantSku: s.variantSku,
        quantity: s.quantity,
        priceAtPurchase: s.price,
      })),
      totalAtPurchase: details.totalAtPurchase,
      currency: details.currency,
      shippingCost: details.shippingCost,
      taxAmount: details.taxAmount,
      ...(shippingZone ? { shippingZone } : {}),
      ...(details.customerVatId ? { customerVatId: details.customerVatId } : {}),
      ...(promo.code ? { promoCode: promo.code } : {}),
      ...(promo.discountAmount > 0 ? { discountAmount: promo.discountAmount } : {}),
    },
  })

  await captureMarketingConsent(payload, session)

  try {
    await decrementStock(
      payload,
      snapshot.map((s) => ({ productId: s.productId, variantSku: s.variantSku, quantity: s.quantity })),
      String(order.id),
    )
  } catch (err) {
    console.error('[stripe webhook] stock decrement failed', err)
  }

  try {
    const settings = await payload.findGlobal({ slug: 'settings' })
    const adminEmail = settings?.storeEmail || undefined
    await sendOrderConfirmation(
      {
        orderId: order.id,
        customerEmail: details.customerEmail,
        customerName: details.customerName,
        items: snapshot.map((s) => ({
          title: s.title,
          quantity: s.quantity,
          priceAtPurchase: s.price,
        })),
        total: details.totalAtPurchase,
        currency: details.currency,
        shippingAddress: details.shippingAddress,
      },
      adminEmail,
    )
  } catch (err) {
    console.error('[stripe webhook] order email failed', err)
  }
}

/**
 * If the customer ticked our newsletter checkbox in the cart before checkout, add
 * them to the newsletter list. The opt-in intent travels via `metadata.newsletterOptIn`
 * (set when the checkout session is created) and is paired here with the email Stripe
 * collected on the hosted page. Stripe's own `consent_collection.promotions` is not
 * available for PL accounts, hence our own checkbox. Called once per order from each
 * finalize path, so a duplicate webhook delivery never re-runs this. Non-fatal: a
 * failure here must not break order processing.
 */
async function captureMarketingConsent(
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  session: Stripe.Checkout.Session,
) {
  if (session.metadata?.newsletterOptIn !== '1') return
  const email = session.customer_details?.email
  if (!email) return
  try {
    await subscribeEmail(payload, {
      email,
      source: 'checkout',
      consentText: CHECKOUT_CONSENT_TEXT,
    })
  } catch (err) {
    console.error('[stripe webhook] newsletter opt-in capture failed', session.id, err)
  }
}

async function decrementStock(
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  lines: StockLine[],
  ref?: string,
) {
  // Single source of truth for stock movements lives in @/lib/stock. The webhook
  // just maps order lines to signed decrements; adjustStock handles the atomic
  // guard, the oversell clamp, and the audit log line.
  for (const line of lines) {
    if (!line.variantSku || !Number.isFinite(line.quantity) || line.quantity <= 0) continue
    try {
      await adjustStock(payload, {
        sku: line.variantSku,
        delta: -line.quantity,
        source: 'store-order',
        reason: ref ? `order ${ref}` : `product ${line.productId}`,
        ...(ref ? { externalRef: ref } : {}),
      })
    } catch (err) {
      console.error(
        `[stripe webhook] failed to decrement stock for sku ${line.variantSku}`,
        err,
      )
    }
  }
}
