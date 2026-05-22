import type { CollectionConfig } from 'payload'

export const NewsletterSubscribers: CollectionConfig = {
  slug: 'newsletter-subscribers',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'source', 'unsubscribed', 'createdAt'],
    description: 'Email subscribers for newsletter / new product announcements. Export from here to your email tool.',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => true,
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'footer',
      options: [
        { label: 'Footer form', value: 'footer' },
        { label: 'Checkout opt-in', value: 'checkout' },
        { label: 'Manual', value: 'manual' },
      ],
    },
    {
      name: 'unsubscribed',
      type: 'checkbox',
      defaultValue: false,
      index: true,
    },
    {
      name: 'ip',
      type: 'text',
      admin: { readOnly: true },
    },
  ],
  timestamps: true,
}
