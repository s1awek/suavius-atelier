import { NextResponse } from 'next/server'
import type { Media } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { stripe } from '@/lib/stripe'

type IncomingItem = { productId: number; quantity: number }

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
    title: string
    price: number
    quantity: number
  }> = []

  for (const item of items) {
    const product = byId.get(item.productId)
    if (!product) {
      return NextResponse.json(
        { error: `Product ${item.productId} not available` },
        { status: 400 }
      )
    }
    const quantity = Math.max(1, Math.floor(item.quantity))

    const firstImage = product.images?.[0]?.image
    const imageUrl =
      typeof firstImage === 'object' && firstImage !== null
        ? (firstImage as Media).url
        : null

    lineItems.push({
      price_data: {
        currency: 'eur',
        unit_amount: product.price,
        product_data: {
          name: product.title,
          ...(imageUrl ? { images: [imageUrl] } : {}),
        },
      },
      quantity,
    })

    orderItemsSnapshot.push({
      productId: product.id,
      title: product.title,
      price: product.price,
      quantity,
    })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    success_url: `${siteUrl}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/`,
    shipping_address_collection: {
      allowed_countries: ['PL', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'CZ', 'SK', 'GB', 'US'],
    },
    phone_number_collection: { enabled: true },
    metadata: {
      itemsSnapshot: JSON.stringify(orderItemsSnapshot),
    },
  })

  return NextResponse.json({ url: session.url, id: session.id })
}
