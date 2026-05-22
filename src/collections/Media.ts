import type { CollectionConfig } from 'payload'
import { setCacheControlOnObject } from '../lib/r2-cache'

const R2_PREFIX = 'media'

function collectKeys(doc: Record<string, unknown>): string[] {
  const keys: string[] = []
  const filename = doc.filename
  if (typeof filename === 'string') keys.push(`${R2_PREFIX}/${filename}`)
  const sizes = doc.sizes
  if (sizes && typeof sizes === 'object') {
    for (const size of Object.values(sizes as Record<string, { filename?: string }>)) {
      if (size && typeof size.filename === 'string') {
        keys.push(`${R2_PREFIX}/${size.filename}`)
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
    doc.url = `${base}/${R2_PREFIX}/${filename}`
  }

  const sizes = doc.sizes
  if (sizes && typeof sizes === 'object') {
    for (const size of Object.values(sizes as Record<string, { filename?: string; url?: string }>)) {
      if (size && typeof size.filename === 'string') {
        size.url = `${base}/${R2_PREFIX}/${size.filename}`
      }
    }
  }
}

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: true,
  hooks: {
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
            setCacheControlOnObject(key).catch((err) => {
              req.payload.logger.warn(
                `R2 cache-control set failed for ${key}: ${err instanceof Error ? err.message : String(err)}`,
              )
            }),
          ),
        )
        return doc
      },
    ],
  },
}
