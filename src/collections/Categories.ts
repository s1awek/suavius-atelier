import type { CollectionConfig } from 'payload'
import { categoryRevalidate } from './hooks/revalidate'
import { syncSlugRedirect } from './hooks/redirect'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'parent', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [categoryRevalidate.afterChange, syncSlugRedirect((s) => `/categories/${s}`)],
    afterDelete: [categoryRevalidate.afterDelete],
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
        description: 'URL-safe identifier, e.g. "pcb-coasters"',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        description: 'Optional parent category for nesting',
      },
    },
  ],
}
