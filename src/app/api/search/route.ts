import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import {
  buildProductWhere,
  parseProductFilters,
  type ProductSearchResult,
} from '@/lib/product-query'
import type { Media, Product } from '@/payload-types'

export const dynamic = 'force-dynamic'

const RESULT_LIMIT = 6
const SUGGESTION_LIMIT = 4
const MIN_QUERY = 2

function coverUrl(p: Product): string | null {
  const first = p.images?.[0]?.image
  return first && typeof first === 'object' ? ((first as Media).url ?? null) : null
}

function toResult(p: Product): ProductSearchResult {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? null,
    image: coverUrl(p),
  }
}

/**
 * Global store search. With `?q=` (>= 2 chars) returns matching products as live
 * results; without a query returns curated suggestions (bestsellers / new, with a
 * newest fallback) for the overlay's resting state. Shape is identical so the
 * client renders both the same way.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') ?? '').trim()
  const payload = await getPayloadClient()

  if (q.length >= MIN_QUERY) {
    const filters = parseProductFilters({ q })
    const result = await payload.find({
      collection: 'products',
      where: buildProductWhere(filters),
      limit: RESULT_LIMIT,
      depth: 1,
      sort: '-updatedAt',
      // Public search must not return drafts (see authenticatedOrPublished).
      overrideAccess: false,
    })
    // Owned, cookieless search analytics: log the query + whether it found anything.
    // Fire-and-forget so it never slows the response or breaks search on failure.
    void payload
      .create({
        collection: 'search-events',
        data: {
          q: q.slice(0, 120),
          resultCount: result.totalDocs,
          zeroResults: result.totalDocs === 0,
        },
      })
      .catch(() => {})
    return NextResponse.json({ items: result.docs.map(toResult) })
  }

  // Resting state: featured pieces first, newest as fallback.
  const featured = await payload.find({
    collection: 'products',
    where: { or: [{ isBestseller: { equals: true } }, { isNew: { equals: true } }] },
    limit: SUGGESTION_LIMIT,
    depth: 1,
    sort: '-updatedAt',
    overrideAccess: false,
  })

  let docs = featured.docs
  if (docs.length < SUGGESTION_LIMIT) {
    const newest = await payload.find({
      collection: 'products',
      limit: SUGGESTION_LIMIT,
      depth: 1,
      sort: '-updatedAt',
      overrideAccess: false,
    })
    const seen = new Set(docs.map((d) => d.id))
    docs = [...docs, ...newest.docs.filter((d) => !seen.has(d.id))].slice(0, SUGGESTION_LIMIT)
  }

  return NextResponse.json({ items: docs.map(toResult) })
}
