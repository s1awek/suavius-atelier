import type { GlobalConfig } from 'payload'

export const Settings: GlobalConfig = {
  slug: 'settings',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'storeName',
      type: 'text',
      required: true,
      defaultValue: 'Suavius Atelier',
    },
    {
      name: 'storeEmail',
      type: 'email',
      required: true,
    },
    {
      name: 'shippingZones',
      type: 'array',
      labels: { singular: 'Shipping Zone', plural: 'Shipping Zones' },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          admin: { description: 'e.g. "Poland", "EU", "Worldwide"' },
        },
        {
          name: 'countries',
          type: 'text',
          required: true,
          admin: { description: 'Comma-separated ISO country codes, or "*" for all' },
        },
        {
          name: 'flatRate',
          type: 'number',
          required: true,
          min: 0,
          admin: { description: 'Flat shipping price (minor units)' },
        },
      ],
    },
    {
      name: 'socialLinks',
      type: 'array',
      labels: { singular: 'Social Link', plural: 'Social Links' },
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'Instagram', value: 'instagram' },
            { label: 'Etsy', value: 'etsy' },
            { label: 'Pinterest', value: 'pinterest' },
            { label: 'X / Twitter', value: 'x' },
            { label: 'TikTok', value: 'tiktok' },
            { label: 'YouTube', value: 'youtube' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'announcementBar',
      type: 'group',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'message',
          type: 'text',
        },
        {
          name: 'link',
          type: 'text',
        },
      ],
    },
  ],
}
