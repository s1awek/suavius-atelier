import type { getPayloadClient } from '@/lib/payload'

type PayloadClient = Awaited<ReturnType<typeof getPayloadClient>>

export type NewsletterSource = 'footer' | 'checkout' | 'manual'

export type SubscribeResult = {
  created: boolean
  resubscribed: boolean
  alreadyActive: boolean
}

/**
 * Idempotent subscribe: create a new subscriber, or re-activate one that had
 * previously unsubscribed (refreshing their consent snapshot). An already-active
 * subscriber is left untouched. Safe to call from request handlers and from the
 * Stripe webhook (which may be delivered more than once).
 */
export async function subscribeEmail(
  payload: PayloadClient,
  opts: {
    email: string
    source: NewsletterSource
    consentText: string
    consentedAt?: string
    ip?: string | null
  },
): Promise<SubscribeResult> {
  const email = opts.email.trim().slice(0, 320).toLowerCase()
  const consentedAt = opts.consentedAt ?? new Date().toISOString()

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
        data: { unsubscribed: false, consentedAt, consentText: opts.consentText },
      })
      return { created: false, resubscribed: true, alreadyActive: false }
    }
    return { created: false, resubscribed: false, alreadyActive: true }
  }

  await payload.create({
    collection: 'newsletter-subscribers',
    data: {
      email,
      source: opts.source,
      unsubscribed: false,
      consentedAt,
      consentText: opts.consentText,
      ...(opts.ip ? { ip: opts.ip } : {}),
    },
  })
  return { created: true, resubscribed: false, alreadyActive: false }
}
