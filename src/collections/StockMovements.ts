import type { CollectionConfig } from 'payload'

/**
 * Append-only audit log of every stock movement in the source of truth.
 * Written by @/lib/stock adjustStock on each applied change (store sale, Etsy
 * sale, manual correction, restock). Two jobs:
 *  - reconciliation: who moved the stock, when, and by how much, per channel.
 *  - idempotency: the Etsy receipts poller checks for an existing movement with
 *    a given `externalRef` before decrementing, so re-polling the same receipt
 *    never double-counts.
 */
export const StockMovements: CollectionConfig = {
  slug: 'stock-movements',
  admin: {
    useAsTitle: 'sku',
    defaultColumns: ['sku', 'delta', 'newStock', 'source', 'externalRef', 'createdAt'],
    description: 'Audit log of stock changes across channels. System-written, read-only.',
    group: 'Shop',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => false, // written only via the Local API from adjustStock
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'sku', type: 'text', required: true, index: true },
    {
      name: 'delta',
      type: 'number',
      required: true,
      admin: { description: 'Signed change applied (negative = sale, positive = restock).' },
    },
    {
      name: 'newStock',
      type: 'number',
      admin: { description: 'Variant stock after the change.' },
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Store order (Stripe)', value: 'store-order' },
        { label: 'Etsy order', value: 'etsy-order' },
        { label: 'Manual', value: 'manual' },
        { label: 'Restock', value: 'restock' },
        { label: 'Seed', value: 'seed' },
      ],
    },
    {
      name: 'externalRef',
      type: 'text',
      index: true,
      admin: {
        description:
          'Idempotency key of the originating event (Stripe order id, Etsy receipt id). Prevents double-counting on retry/re-poll.',
      },
    },
    {
      name: 'clamped',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'A decrement hit insufficient stock and was clamped to 0 (oversold).' },
    },
    { name: 'reason', type: 'text' },
  ],
  timestamps: true,
}
