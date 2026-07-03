import Link from 'next/link'
import Image from 'next/image'
import { getPayloadClient } from '@/lib/payload'
import { NewsletterForm } from '@/components/NewsletterForm'

export const revalidate = 600

export const metadata = {
  title: 'Collections',
  description:
    'Browse Suavius Atelier by design theme - botanical, sport, abstract, and regional collections of PCB and wood pieces.',
}

export default async function CollectionsIndexPage() {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'collections',
    limit: 50,
    sort: 'order',
    depth: 1,
    // Hide draft collections from the public index (see authenticatedOrPublished).
    overrideAccess: false,
  })

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 md:py-20">
      <header className="max-w-3xl mb-14">
        <p className="text-xs uppercase tracking-[0.25em] text-copper mb-4">Browse by theme</p>
        <h1 className="font-display text-4xl md:text-5xl text-dark leading-tight">
          Collections.
        </h1>
        <p className="mt-6 text-lg text-ink leading-relaxed">
          Each collection is a small body of work around a single idea. We design them in
          sets, release them in small batches, and retire them when they are done.
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
        <div className="grid gap-10 md:grid-cols-2">
          {result.docs.map((c) => {
            const hero = typeof c.heroImage === 'object' && c.heroImage ? c.heroImage : null
            return (
              <Link
                key={c.id}
                href={`/collections/${c.slug}`}
                className="group block"
              >
                <div className="aspect-[4/3] bg-warm-mid relative overflow-hidden rounded-md mb-5">
                  {hero?.url ? (
                    <Image
                      src={hero.url}
                      alt={hero.alt ?? c.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-muted text-xs uppercase tracking-[0.2em]">
                      [hero visual]
                    </div>
                  )}
                </div>
                {c.subtitle && (
                  <p className="text-xs uppercase tracking-[0.25em] text-copper mb-2">
                    {c.subtitle}
                  </p>
                )}
                <h2 className="font-display text-3xl text-dark group-hover:text-copper transition-colors">
                  {c.title}
                </h2>
                {c.tagline && (
                  <p className="mt-2 text-ink-muted leading-relaxed">{c.tagline}</p>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
