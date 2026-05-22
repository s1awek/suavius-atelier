import type { CollectionConfig } from 'payload'

export const StockAlerts: CollectionConfig = {
  slug: 'stock-alerts',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'productSlug', 'variantSku', 'notified', 'createdAt'],
    description: 'Email subscriptions for back-in-stock notifications on out-of-stock variants.',
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
      required: true,
      index: true,
    },
    {
      name: 'productSlug',
      type: 'text',
      admin: { readOnly: true, description: 'Cached from product at signup time' },
    },
    {
      name: 'variantSku',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      index: true,
    },
    {
      name: 'notified',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: { description: 'Set automatically when restock email is sent' },
    },
    {
      name: 'notifiedAt',
      type: 'date',
      admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'ip',
      type: 'text',
      admin: { readOnly: true },
    },
  ],
  timestamps: true,
}
