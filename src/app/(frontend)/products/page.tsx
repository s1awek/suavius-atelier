import type { Metadata } from 'next'
import { getPayloadClient } from '@/lib/payload'
import { ProductCard } from '@/components/ProductCard'
import { ProductFilters } from '@/components/ProductFilters'
import {
  buildProductSort,
  buildProductWhere,
  hasActiveFilters,
  parseProductFilters,
} from '@/lib/product-query'

export const metadata: Metadata = { title: 'Shop' }

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const filters = parseProductFilters(await searchParams)
  const payload = await getPayloadClient()

  const result = await payload.find({
    collection: 'products',
    where: buildProductWhere(filters),
    sort: buildProductSort(filters),
    limit: 100,
    // Public listing: let the authenticatedOrPublished gate hide drafts (Local API defaults
    // to overrideAccess: true, which would otherwise leak unpublished products).
    overrideAccess: false,
  })

  const filtered = hasActiveFilters(filters)

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="mb-12">
        <p className="text-xs uppercase tracking-[0.25em] text-copper mb-4">All pieces</p>
        <h1 className="text-4xl md:text-5xl text-dark">Shop</h1>
      </div>

      <ProductFilters />

      {result.docs.length === 0 ? (
        <p className="text-ink-muted">
          {filtered
            ? 'No pieces match these filters. Try widening your search.'
            : 'No products available yet.'}
        </p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {result.docs.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 3} />
          ))}
        </div>
      )}
    </section>
  )
}
