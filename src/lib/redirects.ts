import { permanentRedirect, redirect } from 'next/navigation'
import { getPayloadClient } from './payload'

/**
 * If a redirect is configured for `pathname`, perform it (this throws, like `notFound()`).
 * Otherwise returns so the caller can fall through to `notFound()`.
 *
 * Call this from a dynamic page when the requested document no longer resolves — e.g. a
 * product whose slug changed. The matching 301 is created automatically by the slug hook
 * (see collections/hooks/redirect.ts), so old links and search results keep working.
 */
export async function applyRedirect(pathname: string): Promise<void> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'redirects',
    where: { from: { equals: pathname } },
    limit: 1,
    depth: 0,
  })
  const match = docs[0]
  if (!match?.to) return
  if (match.permanent === false) redirect(match.to)
  permanentRedirect(match.to)
}
