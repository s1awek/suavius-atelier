import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

const redis = url && token ? new Redis({ url, token }) : null

export const checkoutRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: 'rl:checkout',
    })
  : null

// Customer file uploads (personalization artwork). Tighter than checkout: uploads are the
// most abuse-prone public surface, so cap them aggressively per IP.
export const uploadRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(8, '5 m'),
      analytics: true,
      prefix: 'rl:upload',
    })
  : null

export const contactRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '10 m'),
      analytics: true,
      prefix: 'rl:contact',
    })
  : null

export function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

export async function enforceRatelimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<{ ok: true } | { ok: false; retryAfter: number; reset: number }> {
  if (!limiter) return { ok: true }
  const { success, reset } = await limiter.limit(identifier)
  if (success) return { ok: true }
  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
  return { ok: false, retryAfter, reset }
}
