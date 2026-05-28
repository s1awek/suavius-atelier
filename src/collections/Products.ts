import type { CollectionConfig } from 'payload'
import { notifyStockRestock } from './hooks/notifyStockRestock'
import { productRevalidate } from './hooks/revalidate'
import { syncSlugRedirect } from './hooks/redirect'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { generatePreviewPath } from '@/lib/preview'

export const Products: CollectionConfig = {
  slug: 'products',
  // Visibility is a single axis: Payload drafts (`_status: draft|published`). Public
  // queries that don't pass `draft: true` automatically filter to published versions,
  // so we don't carry a second status field.
  versions: { drafts: { autosave: false }, maxPerDoc: 20 },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'material', 'price', 'totalStock', '_status', 'updatedAt'],
    description:
      'Preview will auto-save your edits as a draft so you always see the latest version (you can disable the confirmation prompt with the "don\'t ask again" checkbox).',
    preview: (doc) =>
      doc?.slug ? generatePreviewPath('products', String(doc.slug)) : null,
    components: {
      edit: {
        PreviewButton: '@/components/admin/PreviewWithSaveButton#PreviewWithSaveButton',
      },
    },
  },
  access: {
    read: authenticatedOrPublished,
  },
  hooks: {
    afterChange: [
      notifyStockRestock,
      productRevalidate.afterChange,
      syncSlugRedirect((s) => `/products/${s}`),
    ],
    afterDelete: [productRevalidate.afterDelete],
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
                components: {
                  Description: '@/components/admin/PriceDescription#PriceDescription',
                  Cell: '@/components/admin/PriceCell#PriceCell',
                },
              },
            },
            {
              name: 'compareAtPrice',
              type: 'number',
              min: 0,
              admin: {
                description: 'Optional crossed-out reference price (minor units)',
                components: {
                  Description: '@/components/admin/PriceDescription#PriceDescription',
                  Cell: '@/components/admin/PriceCell#PriceCell',
                },
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
              type: 'row',
              fields: [
                {
                  name: 'isNew',
                  type: 'checkbox',
                  label: 'New',
                  defaultValue: false,
                  admin: {
                    description: 'Show "New" badge on product card and PDP',
                    width: '50%',
                  },
                },
                {
                  name: 'isBestseller',
                  type: 'checkbox',
                  label: 'Bestseller',
                  defaultValue: false,
                  admin: {
                    description: 'Show "Bestseller" badge',
                    width: '50%',
                  },
                },
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
            {
              name: 'totalStock',
              type: 'number',
              virtual: true,
              admin: {
                readOnly: true,
                description: 'Sum of all variant stocks (auto-calculated)',
              },
              hooks: {
                afterRead: [
                  ({ data }) => {
                    const variants = (data?.variants ?? []) as Array<{ stock?: number }>
                    return variants.reduce((sum, v) => sum + (v.stock ?? 0), 0)
                  },
                ],
              },
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
  ],
}
