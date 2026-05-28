import type { CollectionConfig } from 'payload'
import { pageRevalidate } from './hooks/revalidate'
import { syncSlugRedirect } from './hooks/redirect'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { generatePreviewPath } from '@/lib/preview'

export const Pages: CollectionConfig = {
  slug: 'pages',
  versions: { drafts: { autosave: false }, maxPerDoc: 20 },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    description:
      'Preview will auto-save your edits as a draft so you always see the latest version (you can disable the confirmation prompt with the "don\'t ask again" checkbox).',
    preview: (doc) =>
      doc?.slug ? generatePreviewPath('pages', String(doc.slug)) : null,
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
    afterChange: [pageRevalidate.afterChange, syncSlugRedirect((s) => `/${s}`)],
    afterDelete: [pageRevalidate.afterDelete],
  },
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
        description: 'URL path, e.g. "about", "shipping-returns", "faq"',
      },
    },
    {
      name: 'content',
      type: 'richText',
    },
    {
      name: 'seoTitle',
      type: 'text',
    },
    {
      name: 'seoDescription',
      type: 'textarea',
    },
  ],
}
