import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { sendContactMessage } from '@/lib/email'
import { contactRatelimit, enforceRatelimit, getClientIp } from '@/lib/ratelimit'

type IncomingBody = {
  name?: string
  email?: string
  subject?: string
  message?: string
  website?: string
}

const MAX_NAME = 120
const MAX_SUBJECT = 200
const MAX_MESSAGE = 4000

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const limit = await enforceRatelimit(contactRatelimit, ip)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(limit.retryAfter),
        },
      },
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

  const name = String(body.name ?? '').trim().slice(0, MAX_NAME)
  const email = String(body.email ?? '').trim().slice(0, 320)
  const subject = String(body.subject ?? '').trim().slice(0, MAX_SUBJECT) || null
  const message = String(body.message ?? '').trim().slice(0, MAX_MESSAGE)

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }
  if (!message || message.length < 10) {
    return NextResponse.json(
      { error: 'Message must be at least 10 characters' },
      { status: 400 },
    )
  }

  const userAgent = req.headers.get('user-agent') ?? ''

  const payload = await getPayloadClient()

  await payload.create({
    collection: 'contact-messages',
    data: {
      name,
      email,
      subject: subject ?? undefined,
      message,
      ip,
      userAgent: userAgent.slice(0, 500),
      handled: false,
    },
  })

  const recipient = process.env.CONTACT_RECIPIENT_EMAIL ?? process.env.SMTP_USER
  if (recipient) {
    try {
      await sendContactMessage({ name, email, subject, message, ip }, recipient)
    } catch (err) {
      console.error('[contact] admin email failed', err)
    }
  } else {
    console.warn('[contact] no recipient configured (SMTP_USER / CONTACT_RECIPIENT_EMAIL)')
  }

  return NextResponse.json({ ok: true })
}
