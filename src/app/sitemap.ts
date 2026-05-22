import type { MetadataRoute } from 'next'
import { getPayloadClient } from '@/lib/payload'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://suaviusatelier.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()

  const [products, categories, pages, designCollections] = await Promise.all([
    payload.find({
      collection: 'products',
      where: { status: { equals: 'active' } },
      limit: 1000,
      depth: 0,
    }),
    payload.find({ collection: 'categories', limit: 1000, depth: 0 }),
    payload.find({ collection: 'pages', limit: 1000, depth: 0 }),
    payload.find({ collection: 'collections', limit: 1000, depth: 0 }),
  ])

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/collections`, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${SITE_URL}/materials`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/bespoke`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'monthly', priority: 0.5 },
  ]

  const designCollectionEntries: MetadataRoute.Sitemap = designCollections.docs
    .filter((c) => c.slug)
    .map((c) => ({
      url: `${SITE_URL}/collections/${c.slug}`,
      lastModified: c.updatedAt ? new Date(c.updatedAt) : undefined,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

  const productEntries: MetadataRoute.Sitemap = products.docs
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

  const categoryEntries: MetadataRoute.Sitemap = categories.docs
    .filter((c) => c.slug)
    .map((c) => ({
      url: `${SITE_URL}/categories/${c.slug}`,
      lastModified: c.updatedAt ? new Date(c.updatedAt) : undefined,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))

  const pageEntries: MetadataRoute.Sitemap = pages.docs
    .filter((pg) => pg.slug)
    .map((pg) => ({
      url: `${SITE_URL}/${pg.slug}`,
      lastModified: pg.updatedAt ? new Date(pg.updatedAt) : undefined,
      changeFrequency: 'monthly',
      priority: 0.4,
    }))

  return [
    ...staticEntries,
    ...productEntries,
    ...categoryEntries,
    ...designCollectionEntries,
    ...pageEntries,
  ]
}
