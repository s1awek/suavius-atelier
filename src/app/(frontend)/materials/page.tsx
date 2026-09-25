import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import type { Media, Product } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { Breadcrumbs } from '@/components/Breadcrumbs'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Materials & Process',
  description:
    'What a Suavius Atelier coaster is made of: FR4 glass-fibre laminate, an ENIG gold-plated rim and reverse, a UV-cured printed picture, and solid European ash. Designed in Bielawa, Poland.',
}

// Real product shots used on this page, by product slug and a filename fragment.
const SHOTS = {
  header: ['gold-rings-pcb-coaster', 'reverse-2'],
  print: ['topographic-pcb-coaster', 'front'],
  gold: ['topographic-pcb-coaster', 'reverse-2'],
  ash: ['ash-wood-coaster', 'view-3'],
} as const

type Shot = { url: string; alt: string }

async function fetchShots(): Promise<Partial<Record<keyof typeof SHOTS, Shot>>> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    where: { slug: { in: [...new Set(Object.values(SHOTS).map(([slug]) => slug))] } },
    depth: 1,
    limit: 20,
    overrideAccess: false,
  })
  const find = (slug: string, part: string): Shot | undefined => {
    const product = docs.find((p: Product) => p.slug === slug)
    const media = (product?.images ?? [])
      .map((i) => i.image)
      .find((m): m is Media => typeof m === 'object' && !!m?.url && !!m.filename?.includes(part))
    return media ? { url: media.url!, alt: media.alt ?? product!.title } : undefined
  }
  return Object.fromEntries(
    Object.entries(SHOTS).map(([key, [slug, part]]) => [key, find(slug, part)]),
  )
}

export default async function MaterialsPage() {
  const shots = await fetchShots()

  return (
    <>
      <header className="max-w-7xl mx-auto px-6 pt-10 pb-16 md:pt-12 md:pb-24 grid gap-10 md:grid-cols-12 md:items-center">
        <div className="md:col-span-6">
          <Breadcrumbs home items={[{ label: 'Materials' }]} className="mb-8" />
          <h1 className="text-4xl md:text-6xl text-dark leading-[1.02]">
            What it is <em className="text-copper">made of.</em>
          </h1>
          <p className="mt-6 text-lg text-ink leading-relaxed max-w-xl">
            A PCB coaster is a real printed circuit board, made on the same lines as
            professional electronics. There is no circuit on it, only a picture on the front and
            a pattern in gold on the back. Here is what each layer is and why we chose it.
          </p>
        </div>
        {shots.header && (
          <div className="md:col-span-6 relative aspect-square bg-warm-mid">
            <Image
              src={shots.header.url}
              alt={shots.header.alt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-contain p-[8%]"
            />
          </div>
        )}
      </header>

      <section className="bg-board text-silk">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <h2 className="text-4xl md:text-6xl leading-[1.02] max-w-3xl">
            Layer by <em className="text-enig">layer.</em>
          </h2>
          <p className="mt-6 text-lg text-silk-muted leading-relaxed max-w-xl">
            Front to back, the board is three things bonded together.
          </p>

          <div className="mt-12 md:mt-16 space-y-3">
            <Layer
              band={
                shots.print && (
                  <Image
                    src={shots.print.url}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 55vw"
                    className="object-cover scale-[1.8]"
                  />
                )
              }
              bandClass="h-28 md:h-40"
              label="Front"
              title="UV-cured silkscreen print"
              body="The picture is printed in several colours straight onto the board and cured under ultraviolet light. We draw each design in our studio and prepare the colour separations ourselves."
            />
            <Layer
              band={
                <span className="absolute inset-y-0 right-4 flex items-center font-mono text-xs text-board/70">
                  1.6 mm
                </span>
              }
              bandClass="h-36 md:h-52 bg-[#cbc39a] bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.05)_0_2px,transparent_2px_7px),repeating-linear-gradient(-45deg,rgba(0,0,0,0.05)_0_2px,transparent_2px_7px)]"
              label="Core"
              title="FR4 glass-fibre laminate"
              body="Woven glass fibre bonded with epoxy resin and cured under heat and pressure. It is the substrate of most electronics, it does not warp, and it takes a hot cup without complaint. 100 mm across, 38 g."
            />
            <Layer
              band={
                shots.gold && (
                  <Image
                    src={shots.gold.url}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 55vw"
                    className="object-cover scale-[1.8]"
                  />
                )
              }
              bandClass="h-28 md:h-40"
              label="Back and rim"
              title="ENIG gold over copper"
              body="The rim and the pattern on the reverse are the board's copper layer, plated with nickel and a thin coat of immersion gold (ENIG). It is the finish used where contacts must not corrode, so it keeps its colour."
            />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28 grid gap-10 md:grid-cols-12 md:items-center">
        {shots.ash && (
          <div className="md:col-span-6 relative aspect-[4/3] bg-warm-mid overflow-hidden">
            <Image
              src={shots.ash.url}
              alt={shots.ash.alt}
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
        )}
        <div className="md:col-span-6 md:pl-6">
          <h2 className="text-4xl md:text-6xl text-dark leading-[1.02]">
            Solid <em className="text-copper">ash.</em>
          </h2>
          <p className="mt-6 text-lg text-ink leading-relaxed max-w-xl">
            Our wood coaster is a disc of European ash, about 10 cm across and 10 mm thick,
            made for us by a small woodworking shop in Lower Silesia. It is finished with oil
            and wax and nothing else, so the grain stays open to the touch.
          </p>
          <p className="mt-4 text-lg text-ink leading-relaxed max-w-xl">
            There is no print and no engraving. A hand-pressed gold-foil mark is in
            preparation.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-4">
        <h2 className="text-4xl md:text-6xl text-dark leading-[1.02] max-w-3xl">
          Where it is <em className="text-copper">made.</em>
        </h2>
        <ol className="mt-12 md:mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          {PLACES.map((place, i) => (
            <li key={place.title} className="relative border-t border-dark/20 pt-6">
              <span
                aria-hidden="true"
                className="absolute -top-[5px] left-0 h-[9px] w-[9px] rounded-full bg-copper"
              />
              <p className="font-mono text-xs text-copper">
                {String(i + 1).padStart(2, '0')} / {place.where}
              </p>
              <h3 className="mt-3 text-xl md:text-2xl text-dark">{place.title}</h3>
              <p className="mt-3 text-base text-ink leading-relaxed max-w-sm">{place.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-14 flex flex-wrap gap-3">
          <Link
            href="/products"
            className="inline-flex items-center min-h-12 px-7 bg-enig text-board font-medium hover:bg-dark hover:text-warm transition-colors"
          >
            Shop the coasters
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center min-h-12 px-7 border border-dark/25 hover:border-copper hover:text-copper transition-colors"
          >
            About the atelier
          </Link>
        </div>
      </section>
    </>
  )
}

const PLACES = [
  {
    where: 'Bielawa',
    title: 'Drawn in our studio',
    body: 'Every picture and every reverse pattern starts as a drawing in Bielawa, Lower Silesia, and leaves as production files for the board.',
  },
  {
    where: 'Shenzhen and Lower Silesia',
    title: 'Made by specialists',
    body: 'The boards are fabricated, plated and printed by a specialist PCB maker in Shenzhen. The ash discs come from a woodworking shop near us.',
  },
  {
    where: 'Bielawa',
    title: 'Checked and sent',
    body: 'Each piece comes back to the studio, where we check it, pack it and send it to you.',
  },
]

function Layer({
  band,
  bandClass,
  label,
  title,
  body,
}: {
  band: React.ReactNode
  bandClass: string
  label: string
  title: string
  body: string
}) {
  return (
    <div className="grid gap-5 md:grid-cols-12 md:gap-10 md:items-center">
      <div className={`md:col-span-7 relative overflow-hidden ${bandClass}`}>{band}</div>
      <div className="md:col-span-5 pb-6 md:pb-0">
        <p className="font-mono text-xs text-enig">{label}</p>
        <h3 className="mt-2 text-xl md:text-2xl">{title}</h3>
        <p className="mt-2 text-base text-silk-muted leading-relaxed max-w-md">{body}</p>
      </div>
    </div>
  )
}
