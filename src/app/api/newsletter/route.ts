import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { contactRatelimit, enforceRatelimit, getClientIp } from '@/lib/ratelimit'

type IncomingBody = {
  email?: string
  website?: string
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

  const email = String(body.email ?? '').trim().slice(0, 320).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }

  const payload = await getPayloadClient()

  const existing = await payload.find({
    collection: 'newsletter-subscribers',
    where: { email: { equals: email } },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    const sub = existing.docs[0]
    if (sub.unsubscribed) {
      await payload.update({
        collection: 'newsletter-subscribers',
        id: sub.id,
        data: { unsubscribed: false },
      })
    }
    return NextResponse.json({ ok: true, alreadySubscribed: !sub.unsubscribed })
  }

  await payload.create({
    collection: 'newsletter-subscribers',
    data: { email, source: 'footer', unsubscribed: false, ip },
  })

  return NextResponse.json({ ok: true })
}
