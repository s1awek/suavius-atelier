import Link from 'next/link'
import type { Media, Product } from '@/payload-types'
import { getPayloadClient, formatPrice } from '@/lib/payload'
import { ProductCard } from '@/components/ProductCard'
import { HeroVideo } from '@/components/home/HeroVideo'
import { TurnItOver, type Face } from '@/components/home/TurnItOver'
import { StudioClips, type Clip } from '@/components/home/StudioClips'

export const revalidate = 300

// Which pieces carry the hero clip and the turn-over moment. Fallbacks keep the
// page whole if a slug is renamed or unpublished.
const HERO_SLUG = 'black-marble-gold-pcb-coaster'
const TURN_SLUG = 'topographic-pcb-coaster'
// Reverse shot shown at the end of the turn: the flattest one of the set.
const TURN_BACK = 'reverse-2'
// Bench clips further down: the pieces not already carrying the hero or the turn.
const CLIP_SLUGS = [
  'gold-rings-pcb-coaster',
  'tennis-court-pcb-coaster',
  'autumn-forest-pcb-coaster',
  'ash-wood-coaster',
]

function media(product: Product): Media[] {
  return (product.images ?? [])
    .map((i) => i.image)
    .filter((m): m is Media => typeof m === 'object' && m !== null && !!m.url)
}

function findImage(product: Product | undefined, part: string): Media | undefined {
  return product ? media(product).find((m) => m.filename?.includes(part)) : undefined
}

function heroMedia(product: Product | undefined) {
  const video = product?.video
  if (!video || typeof video !== 'object') return null
  const file = typeof video.file === 'object' ? video.file : null
  const poster = typeof video.poster === 'object' ? video.poster : null
  if (!poster?.url) return null
  return { videoUrl: file?.url ?? null, posterUrl: poster.url, alt: poster.alt ?? product!.title }
}

export default async function HomePage() {
  const payload = await getPayloadClient()

  const { docs: products } = await payload.find({
    collection: 'products',
    limit: 12,
    sort: '-updatedAt',
    depth: 1,
    // Hide drafts on the public homepage (see authenticatedOrPublished).
    overrideAccess: false,
  })

  const pcb = products.filter((p) => p.material === 'pcb')
  const wood = products.filter((p) => p.material === 'wood')
  const minPrice = (list: Product[]) =>
    list.length ? Math.min(...list.map((p) => p.price)) : null
  const pcbFrom = minPrice(pcb)
  const woodFrom = minPrice(wood)

  const bySlug = (slug: string) => products.find((p) => p.slug === slug)
  const hero = heroMedia(bySlug(HERO_SLUG)) ?? heroMedia(pcb.find((p) => heroMedia(p)))

  const turnProduct =
    [bySlug(TURN_SLUG), ...pcb].find((p) => findImage(p, 'front') && findImage(p, 'reverse'))
  const frontImg = findImage(turnProduct, 'front')
  const backImg = findImage(turnProduct, TURN_BACK) ?? findImage(turnProduct, 'reverse')
  const faces: { front: Face; back: Face } | null =
    frontImg?.url && backImg?.url
      ? {
          front: { url: frontImg.url, alt: frontImg.alt ?? `${turnProduct!.title}, front` },
          back: { url: backImg.url, alt: backImg.alt ?? `${turnProduct!.title}, reverse` },
        }
      : null

  const clips: Clip[] = CLIP_SLUGS.flatMap((slug) => {
    const product = bySlug(slug)
    const clip = product && heroMedia(product)
    if (!product || !clip) return []
    return [
      {
        href: `/products/${product.slug}`,
        title: product.title,
        posterUrl: clip.posterUrl,
        posterAlt: clip.alt,
        videoUrl: clip.videoUrl,
      },
    ]
  })

  return (
    <>
      {/* Hero: the piece itself, price and one action in the first screen. The clip
          runs under the text column on desktop and fades into the board colour. */}
      <section className="relative bg-board text-silk overflow-hidden">
        <div className="relative h-[34svh] md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-[64%]">
          {hero ? (
            <HeroVideo videoUrl={hero.videoUrl} posterUrl={hero.posterUrl} alt={hero.alt} />
          ) : null}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-board via-board/70 to-transparent hidden md:block"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 md:min-h-[calc(100svh-5.5rem)] md:max-h-[860px] flex items-center">
          <div className="pt-6 pb-12 md:py-20 md:max-w-[34rem]">
            <h1 className="text-[2.15rem] leading-[1.04] md:text-6xl lg:text-7xl md:leading-[0.98] text-silk">
              Circuits, wood, and a quiet kind of <em className="text-enig">craft.</em>
            </h1>
            <p className="mt-4 md:mt-6 text-base md:text-lg text-silk-muted leading-relaxed max-w-md">
              Each coaster is a real circuit board, 1.6 mm of glass-fibre laminate with a plated
              gold rim and a printed picture. There is one in solid ash, too.
            </p>
            {pcbFrom !== null && (
              <p className="mt-5 md:mt-7 text-lg md:text-xl text-silk">
                PCB coasters {formatPrice(pcbFrom)}
                {woodFrom !== null && (
                  <span className="text-silk-muted">, ash wood {formatPrice(woodFrom)}</span>
                )}
              </p>
            )}
            <div className="mt-5 md:mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex items-center min-h-12 px-7 bg-enig text-board font-medium hover:bg-silk transition-colors"
              >
                Shop the coasters
              </Link>
              {faces && (
                <a
                  href="#turn-it-over"
                  className="inline-flex items-center min-h-12 px-7 border border-silk/30 hover:border-enig hover:text-enig transition-colors"
                >
                  See both sides
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {products.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-10 md:mb-14">
            <h2 className="text-4xl md:text-6xl text-dark leading-[1.02]">
              Choose your <em className="text-copper">coaster.</em>
            </h2>
            <Link
              href="/products"
              className="inline-flex items-center min-h-11 px-5 border border-dark/25 hover:border-copper hover:text-copper transition-colors"
            >
              All products
            </Link>
          </div>
          <div className="grid gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-14 grid-cols-2 lg:grid-cols-3">
            {products.slice(0, 6).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {faces && <TurnItOver front={faces.front} back={faces.back} />}

      <section className="max-w-7xl mx-auto px-6 pt-20 md:pt-28">
        {clips.length > 0 && (
          <>
            <div className="grid gap-6 md:grid-cols-12 md:items-end mb-10 md:mb-14">
              <h2 className="md:col-span-7 text-4xl md:text-6xl text-dark leading-[1.02]">
                In the <em className="text-copper">hand.</em>
              </h2>
              <p className="md:col-span-5 text-base md:text-lg text-ink leading-relaxed max-w-md">
                Every design was filmed on our bench before it went on sale. The board in the
                clip is the board you receive.
              </p>
            </div>
            <StudioClips clips={clips} />
          </>
        )}
        <ul className="mt-14 md:mt-20 grid gap-8 md:grid-cols-3 border-t border-dark/15 pt-8">
          <li>
            <h3 className="text-xl text-dark">Takes a fresh espresso</h3>
            <p className="mt-2 text-base text-ink leading-relaxed">
              FR4 is cured under heat and pressure. It does not warp and it does not stain.
            </p>
          </li>
          <li>
            <h3 className="text-xl text-dark">Keeps its colour</h3>
            <p className="mt-2 text-base text-ink leading-relaxed">
              The rim is immersion gold over nickel, the finish used on fine-pitch electronics
              because it does not tarnish.
            </p>
          </li>
          <li>
            <h3 className="text-xl text-dark">Designed in Bielawa</h3>
            <p className="mt-2 text-base text-ink leading-relaxed">
              Every picture is drawn in our studio in Poland. The boards come from a specialist
              fabricator in Shenzhen.
            </p>
          </li>
        </ul>
        <Link
          href="/materials"
          className="mt-10 inline-flex items-center min-h-11 px-5 border border-dark/25 hover:border-copper hover:text-copper transition-colors"
        >
          Materials and process
        </Link>
      </section>
    </>
  )
}
