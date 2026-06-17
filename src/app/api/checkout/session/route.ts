import { NextResponse } from 'next/server'
import type { Media, PersonalizationOption, Product } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { getStripe } from '@/lib/stripe'
import { checkoutRatelimit, enforceRatelimit, getClientIp } from '@/lib/ratelimit'

// What the client sends per line. The server NEVER trusts the price the client computed —
// it recomputes every modifier from the pinned option / product override below.
type IncomingPersonalization = {
  optionId: number
  // Free-text / color value, or — for a `choice` option — the chosen choice's machine value.
  value?: string
  // Id of a `personalization-uploads` doc previously created by the upload endpoint.
  fileId?: number
}
type IncomingItem = {
  productId: number
  variantSku: string
  quantity: number
  personalization?: IncomingPersonalization[]
}

// Snapshot stored on the draft order (matches Orders.items[].personalizations).
type PersonalizationSnapshot = {
  optionLabel: string
  inputType: string
  value?: string
  choiceLabel?: string
  priceModifier: number
  file?: number
}

type ResolvedPersonalizations = {
  snapshot: PersonalizationSnapshot[]
  modifierTotal: number
  descriptionParts: string[]
}

function isProvided(p: IncomingPersonalization, inputType: PersonalizationOption['inputType']): boolean {
  if (inputType === 'file') return typeof p.fileId === 'number'
  return typeof p.value === 'string' && p.value.trim().length > 0
}

/**
 * Authoritatively resolve a line's personalization choices against the product's pinned
 * options. Returns a snapshot + the total per-unit price modifier, or an error string.
 *
 * Hard rules (anti-tampering): every submitted option must actually be pinned to the
 * product; price modifiers come only from the library/product override (never the client);
 * required options must be filled; text length is capped server-side.
 */
function resolvePersonalizations(
  product: Product,
  submitted: IncomingPersonalization[],
): ResolvedPersonalizations | { error: string } {
  const pinned = product.personalizations ?? []
  // optionId -> resolved option + per-product overrides. Relationship is populated at depth 1.
  const pinnedById = new Map<
    number,
    { option: PersonalizationOption; required: boolean; priceModifierOverride: number | null }
  >()
  for (const row of pinned) {
    if (typeof row.option !== 'object' || row.option === null) continue
    const option = row.option as PersonalizationOption
    pinnedById.set(option.id, {
      option,
      required: row.required ?? option.defaultRequired ?? false,
      priceModifierOverride:
        typeof row.priceModifierOverride === 'number' ? row.priceModifierOverride : null,
    })
  }

  const snapshot: PersonalizationSnapshot[] = []
  const descriptionParts: string[] = []
  let modifierTotal = 0
  const seen = new Set<number>()

  for (const p of submitted) {
    const pin = pinnedById.get(p.optionId)
    if (!pin) {
      return { error: 'A selected personalization option is not available for this product' }
    }
    if (seen.has(p.optionId)) {
      return { error: `Personalization "${pin.option.label}" was submitted more than once` }
    }
    seen.add(p.optionId)

    const { option } = pin
    const inputType = option.inputType

    // Skip options the customer left blank (unless required — caught below).
    if (!isProvided(p, inputType)) continue

    const baseModifier =
      pin.priceModifierOverride ?? (typeof option.priceModifier === 'number' ? option.priceModifier : 0)

    if (inputType === 'choice') {
      const choice = (option.choices ?? []).find((c) => c.value === p.value)
      if (!choice) {
        return { error: `Invalid choice for "${option.label}"` }
      }
      const modifier = typeof choice.priceModifier === 'number' ? choice.priceModifier : 0
      modifierTotal += modifier
      snapshot.push({
        optionLabel: option.label,
        inputType,
        value: choice.value,
        choiceLabel: choice.label,
        priceModifier: modifier,
      })
      descriptionParts.push(`${option.label}: ${choice.label}`)
      continue
    }

    if (inputType === 'file') {
      modifierTotal += baseModifier
      snapshot.push({
        optionLabel: option.label,
        inputType,
        priceModifier: baseModifier,
        file: p.fileId,
      })
      descriptionParts.push(`${option.label}: uploaded file`)
      continue
    }

    // text / textarea / color
    const value = (p.value ?? '').trim()
    if ((inputType === 'text' || inputType === 'textarea') && typeof option.maxChars === 'number') {
      if (value.length > option.maxChars) {
        return { error: `"${option.label}" exceeds the ${option.maxChars}-character limit` }
      }
    }
    modifierTotal += baseModifier
    snapshot.push({ optionLabel: option.label, inputType, value, priceModifier: baseModifier })
    descriptionParts.push(`${option.label}: ${value}`)
  }

  // Required options must be filled.
  for (const [optionId, pin] of pinnedById) {
    if (!pin.required) continue
    const match = submitted.find((s) => s.optionId === optionId)
    if (!match || !isProvided(match, pin.option.inputType)) {
      return { error: `"${pin.option.label}" is required for this product` }
    }
  }

  return { snapshot, modifierTotal, descriptionParts }
}

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const limit = await enforceRatelimit(checkoutRatelimit, ip)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many checkout attempts. Please try again in a moment.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(limit.retryAfter),
          'X-RateLimit-Reset': String(limit.reset),
        },
      },
    )
  }

  let body: { items?: IncomingItem[]; newsletterOptIn?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const newsletterOptIn = body.newsletterOptIn === true
  const items = body.items ?? []
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }
  for (const i of items) {
    if (!i || typeof i.productId !== 'number' || typeof i.variantSku !== 'string' || !i.variantSku) {
      return NextResponse.json(
        { error: 'Each cart item requires productId and variantSku' },
        { status: 400 },
      )
    }
  }

  const payload = await getPayloadClient()

  const products = await payload.find({
    collection: 'products',
    where: { id: { in: items.map((i) => i.productId) } },
    limit: items.length,
    depth: 1,
  })

  const byId = new Map(products.docs.map((p) => [p.id, p]))

  // Validate every uploaded-file reference once, up front (it must exist).
  const fileIds = Array.from(
    new Set(
      items.flatMap((i) => (i.personalization ?? []).map((p) => p.fileId).filter((id): id is number => typeof id === 'number')),
    ),
  )
  const knownFileIds = new Set<number>()
  if (fileIds.length > 0) {
    const uploads = await payload.find({
      collection: 'personalization-uploads',
      where: { id: { in: fileIds } },
      limit: fileIds.length,
      depth: 0,
    })
    for (const u of uploads.docs) knownFileIds.add(u.id)
  }

  const lineItems: Array<{
    price_data: {
      currency: string
      unit_amount: number
      tax_behavior: 'inclusive'
      product_data: { name: string; description?: string; images?: string[]; tax_code: string }
    }
    quantity: number
  }> = []
  const orderItems: Array<{
    product: number
    variantSku: string
    quantity: number
    priceAtPurchase: number
    personalizations: PersonalizationSnapshot[]
  }> = []
  let provisionalTotal = 0

  for (const item of items) {
    const product = byId.get(item.productId)
    if (!product) {
      return NextResponse.json(
        { error: `Product ${item.productId} not available` },
        { status: 400 },
      )
    }
    const quantity = Math.max(1, Math.floor(item.quantity))

    const variant = (product.variants ?? []).find((v) => v.sku === item.variantSku)
    if (!variant) {
      return NextResponse.json(
        { error: `Variant ${item.variantSku} not available for ${product.title}` },
        { status: 400 },
      )
    }
    const stock = typeof variant.stock === 'number' ? variant.stock : 0
    if (stock < quantity) {
      return NextResponse.json(
        {
          error:
            stock <= 0
              ? `${product.title} (${variant.name}) is out of stock`
              : `Only ${stock} left of ${product.title} (${variant.name})`,
        },
        { status: 400 },
      )
    }

    // Validate any referenced uploads belong to a real personalization-uploads doc.
    for (const p of item.personalization ?? []) {
      if (typeof p.fileId === 'number' && !knownFileIds.has(p.fileId)) {
        return NextResponse.json(
          { error: `Uploaded file for ${product.title} could not be found. Please re-upload.` },
          { status: 400 },
        )
      }
    }

    const resolved = resolvePersonalizations(product, item.personalization ?? [])
    if ('error' in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: 400 })
    }

    const unitAmount = product.price + resolved.modifierTotal
    provisionalTotal += unitAmount * quantity

    const firstImage = product.images?.[0]?.image
    const imageUrl =
      typeof firstImage === 'object' && firstImage !== null
        ? (firstImage as Media).url
        : null

    const lineName =
      variant.name && variant.name !== 'Standard'
        ? `${product.title} — ${variant.name}`
        : product.title

    const description = resolved.descriptionParts.join(' · ').slice(0, 250) || undefined

    lineItems.push({
      price_data: {
        currency: 'eur',
        unit_amount: unitAmount,
        tax_behavior: 'inclusive',
        product_data: {
          name: lineName,
          tax_code: 'txcd_99999999',
          ...(description ? { description } : {}),
          ...(imageUrl ? { images: [imageUrl] } : {}),
        },
      },
      quantity,
    })

    orderItems.push({
      product: product.id,
      variantSku: variant.sku,
      quantity,
      priceAtPurchase: unitAmount,
      personalizations: resolved.snapshot,
    })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const settings = await payload.findGlobal({ slug: 'settings' })
  const rawZones = (settings as { shippingZones?: Array<{ name: string; countries: string; flatRate: number }> })
    .shippingZones ?? []

  type Zone = { name: string; countries: string[]; flatRate: number }
  const zones: Zone[] = rawZones
    .map((z) => ({
      name: z.name,
      countries: z.countries.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean),
      flatRate: z.flatRate,
    }))
    .filter((z) => z.countries.length > 0 && z.flatRate >= 0)

  const allowedCountries = Array.from(new Set(zones.flatMap((z) => z.countries))).filter(
    (c) => c !== '*',
  )
  if (allowedCountries.length === 0) {
    return NextResponse.json(
      { error: 'Shipping is not configured. Please contact support.' },
      { status: 500 },
    )
  }

  const shippingOptions = zones.map((z) => ({
    shipping_rate_data: {
      type: 'fixed_amount' as const,
      display_name: z.name,
      fixed_amount: { amount: z.flatRate, currency: 'eur' },
      tax_behavior: 'inclusive' as const,
      tax_code: 'txcd_92010001',
      metadata: { zoneName: z.name },
    },
  }))

  // Draft order first: it holds the authoritative items + personalizations + per-unit prices.
  // Stripe only ever sees its id, so we sidestep the 500-char metadata limit and never let
  // the client dictate price. The webhook flips this draft to `paid` and fills in the
  // customer / shipping / tax data from the completed session.
  const draft = await payload.create({
    collection: 'orders',
    data: {
      status: 'pending',
      items: orderItems,
      // Provisional — overwritten with the real Stripe total (incl. shipping + tax) by the webhook.
      totalAtPurchase: provisionalTotal,
      currency: 'EUR',
    },
  })

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    success_url: `${siteUrl}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/`,
    shipping_address_collection: {
      allowed_countries: allowedCountries as never,
    },
    shipping_options: shippingOptions,
    phone_number_collection: { enabled: true },
    allow_promotion_codes: true,
    automatic_tax: { enabled: true },
    tax_id_collection: { enabled: true },
    metadata: {
      orderId: String(draft.id),
      siteUrl,
      // Customer-ticked newsletter opt-in (our own cart checkbox). Read back in the
      // webhook and paired with the email Stripe collects. Stripe's native
      // consent_collection.promotions is unavailable for PL accounts.
      ...(newsletterOptIn ? { newsletterOptIn: '1' } : {}),
    },
  })

  // Best-effort backlink (lookup uses metadata.orderId, so a failure here is non-fatal).
  try {
    await payload.update({
      collection: 'orders',
      id: draft.id,
      data: { stripeCheckoutSessionId: session.id },
    })
  } catch (err) {
    console.error('[checkout] failed to backlink session id to draft order', draft.id, err)
  }

  return NextResponse.json({ url: session.url, id: session.id })
}
