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
  // A handful of pieces reads better as a plain grid; filters appear once the range grows
  // (and always while a filtered URL is open, so it can be cleared).
  const showFilters = filtered || result.totalDocs > 12

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 md:py-20">
      <div className="mb-10 md:mb-12 grid gap-4 md:grid-cols-12 md:items-end">
        <h1 className="md:col-span-7 text-4xl md:text-6xl text-dark leading-[1.02]">
          All <em className="text-copper">coasters.</em>
        </h1>
        <p className="md:col-span-5 text-base md:text-lg text-ink leading-relaxed max-w-md">
          Real circuit boards with a plated gold rim, each with a gold reverse. One in solid
          ash, too.
        </p>
      </div>

      {showFilters && <ProductFilters />}

      {result.docs.length === 0 ? (
        <p className="text-ink-muted">
          {filtered
            ? 'No pieces match these filters. Try widening your search.'
            : 'No products available yet.'}
        </p>
      ) : (
        <div className="grid gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-14 grid-cols-2 lg:grid-cols-3">
          {result.docs.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 3} />
          ))}
        </div>
      )}
    </section>
  )
}
