import type { CollectionConfig } from 'payload'
import { collectionRevalidate } from './hooks/revalidate'
import { syncSlugRedirect } from './hooks/redirect'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { generatePreviewPath } from '@/lib/preview'

export const Collections: CollectionConfig = {
  slug: 'collections',
  versions: { drafts: { autosave: false }, maxPerDoc: 20 },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'order', '_status', 'updatedAt'],
    description:
      'Curated design themes (Botanical, Sport, Abstract, Regional). Each entry becomes a /collections/[slug] landing page. Preview will auto-save your edits as a draft so you always see the latest version.',
    preview: (doc) =>
      doc?.slug ? generatePreviewPath('collections', String(doc.slug)) : null,
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
    afterChange: [collectionRevalidate.afterChange, syncSlugRedirect((s) => `/collections/${s}`)],
    afterDelete: [collectionRevalidate.afterDelete],
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
    },
    {
      name: 'subtitle',
      type: 'text',
      admin: {
        description: 'Short kicker shown above title on landing page (e.g. "Collection 01")',
      },
    },
    {
      name: 'tagline',
      type: 'text',
      admin: {
        description: 'One-line emotional hook shown under title',
      },
    },
    {
      name: 'description',
      type: 'richText',
      admin: {
        description: 'Long-form intro shown above product grid on the collection page',
      },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Hero visual for collection landing page',
      },
    },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: {
        description: 'Products belonging to this collection (manually curated)',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 100,
      admin: {
        description: 'Sort order on /collections index (lower = first)',
      },
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
