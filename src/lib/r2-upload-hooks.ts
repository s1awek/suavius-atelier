import type { CollectionConfig } from 'payload'
import { setObjectHeaders } from './r2-cache'

/**
 * Shared upload hooks for R2-backed collections.
 *
 * Mirrors the inline logic in `collections/Media.ts` (afterRead rewrites public URLs to
 * the R2 CDN host, afterChange stamps long-lived cache-control on the stored objects),
 * parameterised by the storage `prefix` so additional upload collections (e.g.
 * `personalization-uploads`) can reuse it. `prefix` MUST match the prefix configured for
 * the collection in the `s3Storage` plugin in `payload.config.ts`.
 *
 * `opts.contentDisposition` (e.g. `attachment`) is stamped on every stored object so the
 * browser downloads rather than renders it — required for customer-uploaded files, where
 * an inline-rendered SVG/HTML would be a stored-XSS vector. Combined with serving from the
 * separate R2 origin, a hostile upload can't touch the store/admin session.
 */
export function makeR2UploadHooks(
  prefix: string,
  opts: { contentDisposition?: string } = {},
): CollectionConfig['hooks'] {
  function collectKeys(doc: Record<string, unknown>): string[] {
    const keys: string[] = []
    const filename = doc.filename
    if (typeof filename === 'string') keys.push(`${prefix}/${filename}`)
    const sizes = doc.sizes
    if (sizes && typeof sizes === 'object') {
      for (const size of Object.values(sizes as Record<string, { filename?: string }>)) {
        if (size && typeof size.filename === 'string') {
          keys.push(`${prefix}/${size.filename}`)
        }
      }
    }
    return keys
  }

  function rewriteToR2(doc: Record<string, unknown>): void {
    const base = process.env.R2_PUBLIC_URL
    if (!base) return

    const filename = doc.filename
    if (typeof filename === 'string') {
      doc.url = `${base}/${prefix}/${filename}`
    }

    const sizes = doc.sizes
    if (sizes && typeof sizes === 'object') {
      for (const size of Object.values(sizes as Record<string, { filename?: string; url?: string }>)) {
        if (size && typeof size.filename === 'string') {
          size.url = `${base}/${prefix}/${size.filename}`
        }
      }
    }
  }

  return {
    afterRead: [
      ({ doc }) => {
        rewriteToR2(doc as Record<string, unknown>)
        return doc
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create' && operation !== 'update') return doc
        const keys = collectKeys(doc as Record<string, unknown>)
        await Promise.all(
          keys.map((key) =>
            setObjectHeaders(key, { contentDisposition: opts.contentDisposition }).catch((err) => {
              req.payload.logger.warn(
                `R2 cache-control set failed for ${key}: ${err instanceof Error ? err.message : String(err)}`,
              )
            }),
          ),
        )
        return doc
      },
    ],
  }
}
