import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { applyRedirect } from '@/lib/redirects'
import { getPayloadClient } from '@/lib/payload'
import { ProductCard } from '@/components/ProductCard'
import { ProductFilters } from '@/components/ProductFilters'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import {
  buildProductSort,
  buildProductWhere,
  hasActiveFilters,
  parseProductFilters,
} from '@/lib/product-query'

type Params = { slug: string }
type SearchParams = Promise<Record<string, string | string[] | undefined>>

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://suaviusatelier.com'

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const category = result.docs[0]
  return { title: category ? category.title : 'Category not found' }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: SearchParams
}) {
  const { slug } = await params
  const filters = parseProductFilters(await searchParams)
  const payload = await getPayloadClient()

  const catResult = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const category = catResult.docs[0]
  if (!category) {
    await applyRedirect(`/categories/${slug}`)
    notFound()
  }

  const products = await payload.find({
    collection: 'products',
    where: buildProductWhere(filters, { category: { equals: category.id } }),
    sort: buildProductSort(filters),
    limit: 100,
  })

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Shop', item: `${SITE_URL}/products` },
      {
        '@type': 'ListItem',
        position: 2,
        name: category.title,
        item: `${SITE_URL}/categories/${category.slug}`,
      },
    ],
  }

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Breadcrumbs
        items={[
          { label: 'Shop', href: '/products' },
          { label: category.title },
        ]}
        className="mb-8"
      />
      <div className="mb-12">
        <p className="text-xs uppercase tracking-[0.2em] text-copper mb-4">Category</p>
        <h1 className="text-4xl md:text-5xl">{category.title}</h1>
        {category.description && (
          <p className="mt-4 max-w-2xl text-ink-muted">{category.description}</p>
        )}
      </div>

      <ProductFilters />

      {products.docs.length === 0 ? (
        <p className="text-ink-muted">
          {hasActiveFilters(filters)
            ? 'No pieces in this category match these filters. Try widening your search.'
            : 'No products in this category yet.'}
        </p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.docs.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  )
}
