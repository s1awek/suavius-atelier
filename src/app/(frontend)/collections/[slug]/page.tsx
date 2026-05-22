import { notFound } from 'next/navigation'
import Image from 'next/image'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Product } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { ProductCard } from '@/components/ProductCard'
import { Breadcrumbs } from '@/components/Breadcrumbs'

type Params = { slug: string }

export const revalidate = 600

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

export async function generateMetadata({ params }: { params: Promise<Params> }) {
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

export default async function CollectionPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const c = await fetchCollection(slug)
  if (!c) notFound()

  const hero = typeof c.heroImage === 'object' && c.heroImage ? c.heroImage : null
  const products = (c.products ?? []).filter(
    (p): p is Product => typeof p === 'object' && p !== null,
  )

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

      {products.length === 0 ? (
        <p className="text-ink-muted text-center py-12">
          Pieces in this collection are being prepared. Subscribe to the journal to know when
          they are released.
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
