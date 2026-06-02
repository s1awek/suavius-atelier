import type { CollectionConfig } from 'payload'
import { sendShipmentNotification } from '@/lib/email'

function guessCarrierUrl(tracking: string): string | null {
  const t = tracking.trim()
  // InPost - 24 digits
  if (/^\d{24}$/.test(t)) return `https://inpost.pl/sledzenie-przesylek?number=${t}`
  // DPD PL - typical alphanumeric 14 chars
  if (/^\d{14}$/.test(t)) return `https://tracktrace.dpd.com.pl/parcelDetails?p1=${t}`
  // UPS - 1Z + 16 chars
  if (/^1Z[A-Z0-9]{16}$/i.test(t)) return `https://www.ups.com/track?tracknum=${t}`
  // DHL - 10-14 digits
  if (/^\d{10,14}$/.test(t)) return `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${t}`
  // Poczta Polska - 13 chars ending with PL
  if (/^[A-Z]{2}\d{9}PL$/i.test(t)) return `https://emonitoring.poczta-polska.pl/?numer=${t}`
  return null
}

export const Orders: CollectionConfig = {
  slug: 'orders',
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        if (operation !== 'update') return
        const becameShipped = doc.status === 'shipped' && previousDoc?.status !== 'shipped'
        if (!becameShipped) return
        const tracking = doc.shippingTracking
        if (!tracking || typeof tracking !== 'string') return
        const customerEmail = doc.customer?.email
        const customerName = doc.customer?.name
        if (!customerEmail) return

        try {
          await sendShipmentNotification({
            orderId: doc.id,
            customerEmail,
            customerName: customerName ?? '',
            trackingNumber: tracking,
            trackingUrl: guessCarrierUrl(tracking),
          })
          req.payload.logger.info(`Shipment email sent for order #${doc.id}`)
        } catch (err) {
          req.payload.logger.error(`Shipment email failed for order #${doc.id}: ${err}`)
        }
      },
    ],
  },
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
      // Not required: a draft order is created before payment (when the Stripe Checkout
      // session is opened) and has no payment intent yet. The webhook fills this in when
      // the session completes. Unique still holds — Postgres allows multiple NULLs.
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Set by the Stripe webhook once payment succeeds',
      },
    },
    {
      name: 'stripeCheckoutSessionId',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Stripe Checkout session that created this order (set when the draft is opened)',
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
      admin: {
        description: 'Populated from the Stripe session when payment completes (empty on unpaid drafts)',
      },
      // Subfields are not required: the draft order exists before the customer enters their
      // details into Stripe Checkout. The webhook fills these on payment. Paid orders always
      // have them; unpaid drafts (later pruned in Phase 4) may not.
      fields: [
        {
          name: 'email',
          type: 'email',
        },
        {
          name: 'name',
          type: 'text',
        },
        {
          name: 'address',
          type: 'group',
          fields: [
            { name: 'line1', type: 'text' },
            { name: 'line2', type: 'text' },
            { name: 'city', type: 'text' },
            { name: 'postalCode', type: 'text' },
            { name: 'country', type: 'text' },
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
            components: {
              Description: '@/components/admin/PriceDescription#PriceDescription',
              Cell: '@/components/admin/PriceCell#PriceCell',
            },
          },
        },
        {
          name: 'personalizations',
          type: 'array',
          labels: { singular: 'Personalization', plural: 'Personalizations' },
          admin: {
            description:
              'Snapshot of the personalization choices for this line, captured at checkout',
          },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'optionLabel', type: 'text', admin: { width: '50%' } },
                {
                  name: 'inputType',
                  type: 'text',
                  admin: { width: '50%', description: 'text / textarea / choice / color / file' },
                },
              ],
            },
            {
              name: 'value',
              type: 'textarea',
              admin: {
                description: 'Customer-entered value, chosen value, or color',
              },
            },
            {
              name: 'choiceLabel',
              type: 'text',
              admin: {
                description: 'Human-readable label of the chosen option (for choice inputs)',
              },
            },
            {
              name: 'priceModifier',
              type: 'number',
              defaultValue: 0,
              admin: {
                description: 'Price added by this personalization (minor units)',
                components: {
                  Description: '@/components/admin/PriceDescription#PriceDescription',
                  Cell: '@/components/admin/PriceCell#PriceCell',
                },
              },
            },
            {
              name: 'file',
              type: 'relationship',
              relationTo: 'personalization-uploads',
              admin: {
                description: 'Uploaded artwork for this personalization, if any',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'shippingCost',
      type: 'number',
      min: 0,
      defaultValue: 0,
      admin: {
        description: 'Shipping amount charged (minor units), already included in totalAtPurchase',
        components: {
          Description: '@/components/admin/PriceDescription#PriceDescription',
          Cell: '@/components/admin/PriceCell#PriceCell',
        },
      },
    },
    {
      name: 'shippingZone',
      type: 'text',
      admin: {
        description: 'Name of the shipping zone applied at checkout',
      },
    },
    {
      name: 'totalAtPurchase',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Total amount paid (minor units), incl. shipping',
        components: {
          Description: '@/components/admin/PriceDescription#PriceDescription',
          Cell: '@/components/admin/PriceCell#PriceCell',
        },
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
    {
      name: 'taxAmount',
      type: 'number',
      min: 0,
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'VAT/sales tax included in totalAtPurchase (minor units)',
        components: {
          Description: '@/components/admin/PriceDescription#PriceDescription',
          Cell: '@/components/admin/PriceCell#PriceCell',
        },
      },
    },
    {
      name: 'customerVatId',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Tax ID provided by customer at checkout (B2B reverse charge, etc.)',
      },
    },
    {
      name: 'promoCode',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Stripe promotion code applied at checkout, if any',
      },
    },
    {
      name: 'discountAmount',
      type: 'number',
      min: 0,
      admin: {
        readOnly: true,
        description: 'Total discount applied (minor units), if any',
        components: {
          Description: '@/components/admin/PriceDescription#PriceDescription',
          Cell: '@/components/admin/PriceCell#PriceCell',
        },
      },
    },
  ],
  timestamps: true,
}
