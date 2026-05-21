import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'stripePaymentIntentId',
    defaultColumns: ['stripePaymentIntentId', 'status', 'customerEmailDenorm', 'createdAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => false,
  },
  fields: [
    {
      name: 'stripePaymentIntentId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Fulfilled', value: 'fulfilled' },
        { label: 'Shipped', value: 'shipped' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'customer',
      type: 'group',
      fields: [
        {
          name: 'email',
          type: 'email',
          required: true,
        },
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'address',
          type: 'group',
          fields: [
            { name: 'line1', type: 'text', required: true },
            { name: 'line2', type: 'text' },
            { name: 'city', type: 'text', required: true },
            { name: 'postalCode', type: 'text', required: true },
            { name: 'country', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      name: 'customerEmailDenorm',
      type: 'text',
      admin: {
        hidden: true,
      },
      hooks: {
        beforeChange: [
          ({ siblingData }) => {
            const c = (siblingData as { customer?: { email?: string } }).customer
            return c?.email ?? null
          },
        ],
      },
    },
    {
      name: 'items',
      type: 'array',
      labels: { singular: 'Item', plural: 'Items' },
      minRows: 1,
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
        },
        {
          name: 'variantSku',
          type: 'text',
          admin: {
            description: 'SKU of the purchased variant, if applicable',
          },
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 1,
        },
        {
          name: 'priceAtPurchase',
          type: 'number',
          required: true,
          min: 0,
          admin: {
            description: 'Snapshot of price (minor units) at the time of purchase',
          },
        },
      ],
    },
    {
      name: 'totalAtPurchase',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Total amount paid (minor units), incl. shipping',
      },
    },
    {
      name: 'currency',
      type: 'text',
      required: true,
      defaultValue: 'EUR',
      admin: {
        description: 'ISO 4217 currency code',
      },
    },
    {
      name: 'shippingTracking',
      type: 'text',
      admin: {
        description: 'Carrier tracking number, set when shipped',
      },
    },
  ],
  timestamps: true,
}
