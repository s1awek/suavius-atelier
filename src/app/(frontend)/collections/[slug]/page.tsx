import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { applyRedirect } from '@/lib/redirects'
import Image from 'next/image'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Product } from '@/payload-types'
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

async function fetchCollection(slug: string) {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'collections',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })
  return result.docs[0] ?? null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const c = await fetchCollection(slug)
  if (!c) return { title: 'Collection not found' }
  return {
    title: c.seoTitle ?? `${c.title} Collection`,
    description:
      c.seoDescription ??
      c.tagline ??
      `${c.title} collection from Suavius Atelier - hand-designed PCB and wood pieces.`,
  }
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: SearchParams
}) {
  const { slug } = await params
  const filters = parseProductFilters(await searchParams)
  const c = await fetchCollection(slug)
  if (!c) {
    await applyRedirect(`/collections/${slug}`)
    notFound()
  }

  const hero = typeof c.heroImage === 'object' && c.heroImage ? c.heroImage : null

  // The collection curates its own products (hasMany, manually ordered). With no
  // active filters we preserve that curated order; once the visitor searches,
  // filters or re-sorts, we re-query products scoped to this collection's ids so
  // the same query layer applies consistently across listings.
  const curated = (c.products ?? []).filter(
    (p): p is Product => typeof p === 'object' && p !== null,
  )
  const filtered = hasActiveFilters(filters)

  let products = curated
  if (filtered && curated.length > 0) {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'products',
      where: buildProductWhere(filters, { id: { in: curated.map((p) => p.id) } }),
      sort: buildProductSort(filters),
      limit: 100,
    })
    products = result.docs
  } else if (filtered) {
    products = []
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Collections', item: `${SITE_URL}/collections` },
      {
        '@type': 'ListItem',
        position: 2,
        name: c.title,
        item: `${SITE_URL}/collections/${c.slug}`,
      },
    ],
  }

  return (
    <article className="max-w-7xl mx-auto px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Breadcrumbs
        items={[
          { label: 'Collections', href: '/collections' },
          { label: c.title },
        ]}
        className="mb-8"
      />

      <header className="grid md:grid-cols-2 gap-10 md:gap-16 items-center mb-16 md:mb-20">
        <div>
          {c.subtitle && (
            <p className="text-xs uppercase tracking-[0.3em] text-copper mb-4">
              {c.subtitle}
            </p>
          )}
          <h1 className="font-display text-4xl md:text-5xl text-dark leading-tight">
            {c.title}
          </h1>
          {c.tagline && (
            <p className="mt-6 font-display italic text-xl md:text-2xl text-ink-muted leading-snug">
              {c.tagline}
            </p>
          )}
          {c.description && (
            <div className="prose prose-lg max-w-none text-ink mt-8">
              <RichText data={c.description} />
            </div>
          )}
        </div>
        <div className="aspect-[4/5] relative overflow-hidden rounded-md bg-warm-mid">
          {hero?.url ? (
            <Image
              src={hero.url}
              alt={hero.alt ?? c.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-muted text-xs uppercase tracking-[0.2em]">
              [hero visual]
            </div>
          )}
        </div>
      </header>

      {curated.length > 0 && <ProductFilters />}

      {products.length === 0 ? (
        <p className="text-ink-muted text-center py-12">
          {filtered
            ? 'No pieces in this collection match these filters. Try widening your search.'
            : 'Pieces in this collection are being prepared. Subscribe to the journal to know when they are released.'}
        </p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </article>
  )
}
