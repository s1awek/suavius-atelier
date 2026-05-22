import { NextResponse } from 'next/server'
import type { Media } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { getStripe } from '@/lib/stripe'

type IncomingItem = { productId: number; variantSku: string; quantity: number }

export async function POST(req: Request) {
  let body: { items?: IncomingItem[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

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
    where: {
      and: [
        { id: { in: items.map((i) => i.productId) } },
        { status: { equals: 'active' } },
      ],
    },
    limit: items.length,
    depth: 1,
  })

  const byId = new Map(products.docs.map((p) => [p.id, p]))

  const lineItems: Array<{
    price_data: {
      currency: string
      unit_amount: number
      product_data: { name: string; images?: string[] }
    }
    quantity: number
  }> = []
  const orderItemsSnapshot: Array<{
    productId: number
    variantSku: string
    title: string
    price: number
    quantity: number
  }> = []

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

    const firstImage = product.images?.[0]?.image
    const imageUrl =
      typeof firstImage === 'object' && firstImage !== null
        ? (firstImage as Media).url
        : null

    const lineName =
      variant.name && variant.name !== 'Standard'
        ? `${product.title} — ${variant.name}`
        : product.title

    lineItems.push({
      price_data: {
        currency: 'eur',
        unit_amount: product.price,
        product_data: {
          name: lineName,
          ...(imageUrl ? { images: [imageUrl] } : {}),
        },
      },
      quantity,
    })

    orderItemsSnapshot.push({
      productId: product.id,
      variantSku: variant.sku,
      title: product.title,
      price: product.price,
      quantity,
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
      metadata: { zoneName: z.name },
    },
  }))

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
    metadata: {
      itemsSnapshot: JSON.stringify(orderItemsSnapshot),
      siteUrl,
    },
  })

  return NextResponse.json({ url: session.url, id: session.id })
}
