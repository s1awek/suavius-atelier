import type { CollectionConfig } from 'payload'

/**
 * Global library of reusable personalization options.
 *
 * Products pin options from this library (see `Products.personalizations`) and may
 * override their price modifier / required flag per product. Definitions live here so a
 * change to e.g. "Laser engraving" copy or pricing propagates to every product that uses
 * it. Order line items snapshot the resolved values (see `Orders.items[].personalizations`)
 * so historical orders stay readable even after a definition changes.
 *
 * Prices are in minor units (e.g. 1000 = 10.00), matching `Products.price`. All modifiers
 * here are advisory: the checkout recomputes the authoritative price server-side (Phase 2).
 */
export const PersonalizationOptions: CollectionConfig = {
  slug: 'personalization-options',
  labels: {
    singular: 'Personalization Option',
    plural: 'Personalization Options',
  },
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'inputType', 'method', 'priceModifier', 'updatedAt'],
    description:
      'Reusable personalization fields (engraving text, color, file upload, etc.) that products can pin and optionally override.',
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      admin: {
        description: 'Shown to the customer, e.g. "Laser engraving" or "Number of sides"',
      },
    },
    {
      name: 'inputType',
      type: 'select',
      required: true,
      defaultValue: 'text',
      options: [
        { label: 'Short text', value: 'text' },
        { label: 'Long text (textarea)', value: 'textarea' },
        { label: 'Choice (dropdown / radio / swatch)', value: 'choice' },
        { label: 'Color', value: 'color' },
        { label: 'File upload', value: 'file' },
      ],
      admin: {
        description: 'How the customer fills this option in on the product page',
      },
    },
    {
      name: 'helpText',
      type: 'text',
      admin: {
        description: 'Optional hint shown under the field on the product page',
      },
    },
    {
      name: 'method',
      type: 'select',
      defaultValue: 'other',
      options: [
        { label: 'Engraving', value: 'engraving' },
        { label: 'Printing', value: 'printing' },
        { label: 'Special order', value: 'special-order' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        description: 'Production method tag (for filtering / future workflows, e.g. screen printing)',
      },
    },
    {
      name: 'maxChars',
      type: 'number',
      min: 1,
      admin: {
        description: 'Max characters allowed (text / long text only)',
        condition: (_, siblingData) =>
          siblingData?.inputType === 'text' || siblingData?.inputType === 'textarea',
      },
    },
    {
      name: 'choices',
      type: 'array',
      labels: { singular: 'Choice', plural: 'Choices' },
      admin: {
        description: 'Selectable options, each with an optional price modifier',
        condition: (_, siblingData) => siblingData?.inputType === 'choice',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', required: true, admin: { width: '40%' } },
            {
              name: 'value',
              type: 'text',
              required: true,
              admin: {
                width: '30%',
                description: 'Stable machine value (e.g. "1-side")',
              },
            },
            {
              name: 'priceModifier',
              type: 'number',
              defaultValue: 0,
              admin: {
                width: '30%',
                description: 'Added price (minor units)',
                components: {
                  Description: '@/components/admin/PriceDescription#PriceDescription',
                },
              },
            },
          ],
        },
      ],
    },
    {
      name: 'presentation',
      type: 'select',
      defaultValue: 'dropdown',
      options: [
        { label: 'Dropdown', value: 'dropdown' },
        { label: 'Radio buttons', value: 'radio' },
        { label: 'Color swatches', value: 'swatch' },
      ],
      admin: {
        description: 'How choices are rendered on the product page',
        condition: (_, siblingData) => siblingData?.inputType === 'choice',
      },
    },
    {
      name: 'priceModifier',
      type: 'number',
      defaultValue: 0,
      admin: {
        description:
          'Base price added when this option is used (minor units). For choices, use the per-choice modifier instead.',
        condition: (_, siblingData) => siblingData?.inputType !== 'choice',
        components: {
          Description: '@/components/admin/PriceDescription#PriceDescription',
          Cell: '@/components/admin/PriceCell#PriceCell',
        },
      },
    },
    {
      name: 'fileConfig',
      type: 'group',
      admin: {
        description: 'Upload constraints (file upload only)',
        condition: (_, siblingData) => siblingData?.inputType === 'file',
      },
      fields: [
        {
          name: 'allowedTypes',
          type: 'select',
          hasMany: true,
          defaultValue: ['image/png', 'image/jpeg', 'image/svg+xml', 'application/pdf'],
          options: [
            { label: 'PNG', value: 'image/png' },
            { label: 'JPEG', value: 'image/jpeg' },
            { label: 'SVG', value: 'image/svg+xml' },
            { label: 'PDF', value: 'application/pdf' },
          ],
          admin: {
            description: 'MIME types accepted for upload (enforced server-side)',
          },
        },
        {
          name: 'maxSizeMB',
          type: 'number',
          min: 1,
          defaultValue: 10,
          admin: {
            description: 'Max upload size in megabytes (enforced server-side)',
          },
        },
        {
          name: 'uploadInstructions',
          type: 'textarea',
          admin: {
            description: 'Guidance shown next to the upload field (e.g. "300 DPI, vector preferred")',
          },
        },
      ],
    },
    {
      name: 'defaultRequired',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this option is required by default (a product can override this)',
      },
    },
    {
      name: 'quoteOnly',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Reserved for the future quote-request flow (no online payment). Not active yet — leave off.',
      },
    },
  ],
}
