import type { CollectionConfig } from 'payload'
import { syncRedirectsToEdgeConfig } from '@/lib/edge-config-redirects'

/**
 * Site-relative URL redirects. Rows are created automatically when a product / page /
 * collection / category slug changes (see hooks/redirect.ts), and can also be added by
 * hand. Applied in dynamic pages via `applyRedirect` when a slug no longer resolves.
 */
export const Redirects: CollectionConfig = {
  slug: 'redirects',
  admin: {
    useAsTitle: 'from',
    defaultColumns: ['from', 'to', 'permanent', 'updatedAt'],
    description:
      'URL redirects (site-relative paths, e.g. /products/old -> /products/new). Auto-created on slug changes; editable by hand.',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    // Keep the edge redirect map in sync on every change (no-op until Edge Config is set up).
    afterChange: [
      async ({ doc, req }) => {
        await syncRedirectsToEdgeConfig(req.payload)
        return doc
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        await syncRedirectsToEdgeConfig(req.payload)
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'from',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Source path to redirect from, e.g. /products/old-slug' },
    },
    {
      name: 'to',
      type: 'text',
      required: true,
      admin: { description: 'Destination path, e.g. /products/new-slug' },
    },
    {
      name: 'permanent',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'On = permanent (308/301), off = temporary (307/302). Keep on for slug changes so search engines update.',
      },
    },
  ],
  timestamps: true,
}
