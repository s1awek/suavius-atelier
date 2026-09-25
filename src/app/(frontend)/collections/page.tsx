import Link from 'next/link'
import type { Product } from '@/payload-types'
import { DiscRow } from '@/components/DiscRow'
import { getPayloadClient } from '@/lib/payload'
import { NewsletterForm } from '@/components/NewsletterForm'
import { Breadcrumbs } from '@/components/Breadcrumbs'

export const revalidate = 600

export const metadata = {
  title: 'Collections',
  description:
    'Browse Suavius Atelier circuit board coasters by theme.',
}

export default async function CollectionsIndexPage() {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'collections',
    limit: 50,
    sort: 'order',
    // Products and their images, for the front shots on each tile.
    depth: 2,
    // Hide draft collections from the public index (see authenticatedOrPublished).
    overrideAccess: false,
  })

  return (
    <section className="max-w-7xl mx-auto px-6 pt-10 pb-16 md:pt-12 md:pb-24">
      <Breadcrumbs home items={[{ label: 'Collections' }]} className="mb-8" />
      <header className="max-w-3xl mb-12 md:mb-16">
        <h1 className="text-4xl md:text-6xl text-dark leading-[1.02]">
          By <em className="text-copper">theme.</em>
        </h1>
        <p className="mt-6 text-lg text-ink leading-relaxed max-w-xl">
          Each collection is a small body of work around one idea, drawn in our studio and
          made as real circuit boards.
        </p>
      </header>

      {result.docs.length === 0 ? (
        <div className="max-w-md">
          <p className="text-ink-muted mb-6 leading-relaxed">
            Collections are being prepared. Leave your email and we will tell you the moment the
            first ones are released.
          </p>
          <NewsletterForm />
        </div>
      ) : (
        <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {result.docs.map((c) => {
            const products = (c.products ?? []).filter(
              (p): p is Product => typeof p === 'object' && p !== null,
            )
            return (
              <Link key={c.id} href={`/collections/${c.slug}`} className="group block">
                <DiscRow
                  products={products}
                  sizes="(max-width: 768px) 40vw, 14vw"
                  className="aspect-[4/3] mb-5"
                />
                <h2 className="text-2xl md:text-3xl text-dark group-hover:text-copper transition-colors">
                  {c.title}
                </h2>
                {c.tagline && <p className="mt-2 text-ink-muted leading-relaxed">{c.tagline}</p>}
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
