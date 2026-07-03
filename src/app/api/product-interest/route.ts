import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { contactRatelimit, enforceRatelimit, getClientIp } from '@/lib/ratelimit'
import { PRODUCT_INTEREST_CONSENT_TEXT } from '@/lib/product-interest-consent'

const TOPICS = ['gold-foil-personalization', 'other'] as const
type Topic = (typeof TOPICS)[number]

type IncomingBody = {
  productId?: number
  topic?: string
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

  // Honeypot — silently accept and drop.
  if (body.website && body.website.trim().length > 0) {
    return NextResponse.json({ ok: true })
  }

  const productId = Number(body.productId)
  const topic: Topic = TOPICS.includes(body.topic as Topic)
    ? (body.topic as Topic)
    : 'gold-foil-personalization'
  const email = String(body.email ?? '').trim().slice(0, 320).toLowerCase()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }
  if (body.consent !== true) {
    return NextResponse.json(
      { error: 'You must accept the Privacy Policy to register interest' },
      { status: 400 },
    )
  }

  const payload = await getPayloadClient()

  let productSlug: string | null = null
  if (Number.isFinite(productId) && productId > 0) {
    const product = await payload.findByID({ collection: 'products', id: productId, depth: 0 }).catch(() => null)
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    productSlug = product.slug ?? null
  }

  // Idempotent per (email, topic, product): a repeat tap shouldn't create duplicates.
  const existing = await payload.find({
    collection: 'product-interest',
    where: {
      and: [
        { email: { equals: email } },
        { topic: { equals: topic } },
        ...(Number.isFinite(productId) && productId > 0 ? [{ product: { equals: productId } }] : []),
      ],
    },
    limit: 1,
  })
  if (existing.docs.length > 0) {
    return NextResponse.json({ ok: true, alreadyRegistered: true })
  }

  await payload.create({
    collection: 'product-interest',
    data: {
      ...(Number.isFinite(productId) && productId > 0 ? { product: productId } : {}),
      productSlug,
      topic,
      email,
      consentedAt: new Date().toISOString(),
      consentText: PRODUCT_INTEREST_CONSENT_TEXT,
      ip,
    },
  })

  return NextResponse.json({ ok: true })
}
