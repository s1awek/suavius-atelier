import type { CollectionConfig } from 'payload'

/**
 * Demand-validation capture for features that don't exist yet (e.g. hand-pressed gold-foil
 * personalisation on the wood pieces). A visitor registers interest in one step from the
 * product page; we email them when the feature is ready. Distinct from `stock-alerts` (which
 * is "notify me when this exact variant is back") and from `newsletter-subscribers` (which
 * dedupes by email and would lose the per-product/topic signal we want here).
 */
export const ProductInterest: CollectionConfig = {
  slug: 'product-interest',
  labels: { singular: 'Product Interest', plural: 'Product Interest' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'topic', 'productSlug', 'createdAt'],
    description:
      'People who registered interest in an upcoming option (e.g. gold-foil personalisation). Export and email them when it ships.',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => true,
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      index: true,
    },
    {
      name: 'productSlug',
      type: 'text',
      admin: { readOnly: true, description: 'Cached from product at signup time' },
    },
    {
      name: 'topic',
      type: 'select',
      required: true,
      defaultValue: 'gold-foil-personalization',
      options: [
        { label: 'Gold-foil personalisation (wood)', value: 'gold-foil-personalization' },
        { label: 'Other', value: 'other' },
      ],
      admin: { description: 'Which upcoming option this person wants' },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      index: true,
    },
    {
      name: 'consentedAt',
      type: 'date',
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Timestamp when the visitor accepted the Privacy Policy',
      },
    },
    {
      name: 'consentText',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Exact consent wording shown at signup (snapshot for legal evidence)',
      },
    },
    {
      name: 'ip',
      type: 'text',
      admin: { readOnly: true },
    },
  ],
  timestamps: true,
}
