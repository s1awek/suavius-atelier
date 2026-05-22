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
            components: {
              Description: '@/components/admin/PriceDescription#PriceDescription',
              Cell: '@/components/admin/PriceCell#PriceCell',
            },
          },
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
  ],
  timestamps: true,
}
