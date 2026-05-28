import type { CollectionAfterChangeHook } from 'payload'
import { isPublished } from './published'

/**
 * Keeps SEO-friendly 301s in sync when a document's slug changes. `pathFor` maps a slug to
 * its public path, e.g. `(s) => `/products/${s}``.
 *
 * On a slug change it:
 *  - creates (or updates) a redirect from the old path to the new one,
 *  - repoints any existing redirect that targeted the old path to the new one (no chains),
 *  - removes any stale redirect whose source equals the now-live new path.
 *
 * All writes use overrideAccess and are wrapped, so a redirect glitch never blocks the save.
 */
export function syncSlugRedirect(pathFor: (slug: string) => string): CollectionAfterChangeHook {
  return async ({ doc, previousDoc, operation, req }) => {
    if (operation !== 'update') return doc
    // Only mint a redirect once the new slug is actually live. Slug changes saved to a
    // draft aren't public yet; the redirect is created when that draft is published.
    if (!isPublished(doc)) return doc

    const oldSlug = typeof previousDoc?.slug === 'string' ? previousDoc.slug : undefined
    const newSlug =
      typeof (doc as { slug?: unknown }).slug === 'string'
        ? (doc as { slug: string }).slug
        : undefined
    if (!oldSlug || !newSlug || oldSlug === newSlug) return doc

    const from = pathFor(oldSlug)
    const to = pathFor(newSlug)
    const { payload } = req

    try {
      // old path -> new path (upsert on the unique `from`)
      const existing = await payload.find({
        collection: 'redirects',
        where: { from: { equals: from } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      if (existing.docs[0]) {
        await payload.update({
          collection: 'redirects',
          id: existing.docs[0].id,
          data: { to, permanent: true },
          overrideAccess: true,
        })
      } else {
        await payload.create({
          collection: 'redirects',
          data: { from, to, permanent: true },
          overrideAccess: true,
        })
      }

      // collapse chains: whatever pointed at the old path now points at the new one
      const pointingToOld = await payload.find({
        collection: 'redirects',
        where: { to: { equals: from } },
        limit: 100,
        depth: 0,
        overrideAccess: true,
      })
      for (const r of pointingToOld.docs) {
        await payload.update({ collection: 'redirects', id: r.id, data: { to }, overrideAccess: true })
      }

      // the new path is live again — drop any stale redirect shadowing it
      const shadowing = await payload.find({
        collection: 'redirects',
        where: { from: { equals: to } },
        limit: 10,
        depth: 0,
        overrideAccess: true,
      })
      for (const r of shadowing.docs) {
        await payload.delete({ collection: 'redirects', id: r.id, overrideAccess: true })
      }
    } catch (err) {
      payload.logger.error(`[redirects] failed to sync ${from} -> ${to}: ${String(err)}`)
    }

    return doc
  }
}
