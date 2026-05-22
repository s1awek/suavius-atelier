import Link from 'next/link'
import { getPayloadClient } from '@/lib/payload'
import { ProductCard } from '@/components/ProductCard'

export const revalidate = 300

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
          <div className="aspect-square relative overflow-hidden rounded-md">
            <div className="absolute inset-0 bg-[#ede2cf]" aria-hidden="true" />
            <svg
              className="absolute inset-0 w-full h-full opacity-[0.06]"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <filter id="heroPaper">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
                <feColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.15  0 0 0 0 0.1  0 0 0 1 0" />
              </filter>
              <rect width="100%" height="100%" filter="url(#heroPaper)" />
            </svg>

            <div className="relative h-full flex flex-col p-8 md:p-10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-ink-muted">
                    Suavius Atelier
                  </p>
                  <div className="mt-2 w-12 h-px bg-copper" />
                </div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-ink-muted">
                  Anno MMXXVI
                </p>
              </div>

              <div className="flex-1 flex items-center">
                <blockquote className="font-display italic text-2xl md:text-3xl leading-tight text-dark">
                  <span className="text-copper text-4xl leading-none mr-1">&ldquo;</span>
                  Small batches, hand-finished, designed to outlast the trend that asked for them.
                  <span className="text-copper text-4xl leading-none ml-1">&rdquo;</span>
                </blockquote>
              </div>

              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-ink-muted">From the</p>
                  <p className="font-display italic text-lg mt-1">Atelier journal</p>
                </div>
                <svg
                  width="56"
                  height="56"
                  viewBox="0 0 56 56"
                  fill="none"
                  className="text-copper opacity-90"
                  aria-hidden="true"
                >
                  <circle cx="28" cy="28" r="27" stroke="currentColor" strokeWidth="0.6" />
                  <circle cx="28" cy="28" r="20" stroke="currentColor" strokeWidth="0.4" opacity="0.6" />
                  <path
                    d="M 18 28 L 24 34 L 38 20"
                    stroke="currentColor"
                    strokeWidth="1"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
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
            {featured.docs.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i === 0} />
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

