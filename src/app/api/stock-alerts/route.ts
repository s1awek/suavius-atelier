import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { contactRatelimit, enforceRatelimit, getClientIp } from '@/lib/ratelimit'
import { STOCK_ALERT_CONSENT_TEXT } from '@/lib/stock-alert-consent'

type IncomingBody = {
  productId?: number
  variantSku?: string
  email?: string
  website?: string
  consent?: boolean
}

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const limit = await enforceRatelimit(contactRatelimit, ip)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    )
  }

  let body: IncomingBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (body.website && body.website.trim().length > 0) {
    return NextResponse.json({ ok: true })
  }

  const productId = Number(body.productId)
  const variantSku = String(body.variantSku ?? '').trim().slice(0, 120)
  const email = String(body.email ?? '').trim().slice(0, 320)

  if (!Number.isFinite(productId) || productId <= 0) {
    return NextResponse.json({ error: 'Invalid product' }, { status: 400 })
  }
  if (!variantSku) {
    return NextResponse.json({ error: 'Variant required' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }
  if (body.consent !== true) {
    return NextResponse.json(
      { error: 'You must accept the Privacy Policy to join the waitlist' },
      { status: 400 },
    )
  }

  const payload = await getPayloadClient()
  const consentedAt = new Date().toISOString()

  const product = await payload.findByID({
    collection: 'products',
    id: productId,
    depth: 0,
  })
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const existing = await payload.find({
    collection: 'stock-alerts',
    where: {
      and: [
        { email: { equals: email } },
        { variantSku: { equals: variantSku } },
        { notified: { equals: false } },
      ],
    },
    limit: 1,
  })
  if (existing.docs.length > 0) {
    return NextResponse.json({ ok: true, alreadySubscribed: true })
  }

  await payload.create({
    collection: 'stock-alerts',
    data: {
      product: productId,
      productSlug: product.slug ?? null,
      variantSku,
      email,
      notified: false,
      consentedAt,
      consentText: STOCK_ALERT_CONSENT_TEXT,
      ip,
    },
  })

  return NextResponse.json({ ok: true })
}
