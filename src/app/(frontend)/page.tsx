import Link from 'next/link'
import { getPayloadClient } from '@/lib/payload'
import { ProductCard } from '@/components/ProductCard'

export default async function HomePage() {
  const payload = await getPayloadClient()

  const featured = await payload.find({
    collection: 'products',
    where: { status: { equals: 'active' } },
    limit: 6,
    sort: '-updatedAt',
  })

  return (
    <>
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="grid gap-12 md:grid-cols-2 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-copper mb-6">
              Hand-designed in our atelier
            </p>
            <h1 className="text-5xl md:text-6xl leading-[1.05]">
              Circuits, wood, and a quiet kind of craft.
            </h1>
            <p className="mt-6 text-lg text-ink-muted max-w-md">
              PCB coasters with ENIG copper finish and laser-engraved wood pieces — designed
              to last, made in small batches.
            </p>
            <div className="mt-10 flex gap-4">
              <Link
                href="/products"
                className="inline-flex items-center px-6 py-3 bg-dark text-warm hover:bg-copper transition-colors text-sm tracking-wide"
              >
                Browse the shop
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center px-6 py-3 border border-dark/20 hover:border-copper hover:text-copper transition-colors text-sm tracking-wide"
              >
                The story
              </Link>
            </div>
          </div>
          <div className="aspect-square bg-warm-mid border border-warm-mid flex items-center justify-center text-ink-muted text-sm">
            [hero image placeholder]
          </div>
        </div>
      </section>

      {featured.docs.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-end justify-between mb-10">
            <h2 className="text-3xl md:text-4xl">Featured</h2>
            <Link
              href="/products"
              className="text-sm text-copper hover:text-dark transition-colors"
            >
              See all -&gt;
            </Link>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featured.docs.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-copper mb-6">Material & process</p>
        <h2 className="text-3xl md:text-4xl mb-6">Why a PCB makes a beautiful coaster</h2>
        <p className="text-lg text-ink-muted">
          We start with FR4 laminate — the same fiberglass-epoxy used in fine electronics —
          plate it with gold-over-nickel (ENIG), then print designs with UV silkscreen. The
          result is a small object that catches light like a circuit board and survives daily
          use like one too.
        </p>
      </section>
    </>
  )
}

