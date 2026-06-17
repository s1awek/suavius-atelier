import type { CollectionConfig } from 'payload'

/**
 * First-party, cookieless search log. Records WHAT visitors search for and which queries
 * return nothing - owned data (queryable in admin), no personal info, no third-party tracker.
 * Tells us demand signals and catalog gaps without a heatmap's privacy/effort cost.
 */
export const SearchEvents: CollectionConfig = {
  slug: 'search-events',
  admin: {
    useAsTitle: 'q',
    defaultColumns: ['q', 'resultCount', 'zeroResults', 'createdAt'],
    description: 'What visitors search for, and which queries return zero results. No personal data.',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => true,
    update: () => false,
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'q', type: 'text', required: true, index: true },
    { name: 'resultCount', type: 'number', defaultValue: 0 },
    { name: 'zeroResults', type: 'checkbox', defaultValue: false, index: true },
  ],
  timestamps: true,
}
