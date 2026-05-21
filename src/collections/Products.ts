import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'material', 'price', 'status', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              index: true,
              admin: {
                description: 'URL-safe identifier, e.g. "copper-circuit-coaster"',
              },
            },
            {
              name: 'description',
              type: 'richText',
            },
            {
              name: 'category',
              type: 'relationship',
              relationTo: 'categories',
            },
            {
              name: 'images',
              type: 'array',
              minRows: 1,
              labels: { singular: 'Image', plural: 'Images' },
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          label: 'Pricing & Inventory',
          fields: [
            {
              name: 'price',
              type: 'number',
              required: true,
              min: 0,
              admin: {
                description: 'Price in minor units (e.g. 4900 = 49.00 PLN/EUR/USD)',
              },
            },
            {
              name: 'compareAtPrice',
              type: 'number',
              min: 0,
              admin: {
                description: 'Optional crossed-out reference price (minor units)',
              },
            },
            {
              name: 'material',
              type: 'select',
              required: true,
              options: [
                { label: 'PCB (FR4 + ENIG)', value: 'pcb' },
                { label: 'Wood (laser engraved)', value: 'wood' },
                { label: 'Other', value: 'other' },
              ],
            },
            {
              name: 'variants',
              type: 'array',
              labels: { singular: 'Variant', plural: 'Variants' },
              fields: [
                {
                  name: 'name',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'sku',
                  type: 'text',
                  required: true,
                  unique: true,
                },
                {
                  name: 'stock',
                  type: 'number',
                  required: true,
                  defaultValue: 0,
                  min: 0,
                },
              ],
            },
          ],
        },
        {
          label: 'Shipping',
          fields: [
            {
              name: 'weightGrams',
              type: 'number',
              min: 0,
              admin: {
                description: 'Net product weight in grams (for shipping estimation)',
              },
            },
            {
              name: 'dimensions',
              type: 'group',
              admin: {
                description: 'Physical dimensions in millimeters',
              },
              fields: [
                { name: 'widthMm', type: 'number', min: 0 },
                { name: 'heightMm', type: 'number', min: 0 },
                { name: 'depthMm', type: 'number', min: 0 },
              ],
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'seoTitle',
              type: 'text',
            },
            {
              name: 'seoDescription',
              type: 'textarea',
            },
            {
              name: 'seoImage',
              type: 'upload',
              relationTo: 'media',
            },
          ],
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
