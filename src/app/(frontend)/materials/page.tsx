import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/Breadcrumbs'

export const metadata: Metadata = {
  title: 'Materials & Process',
  description:
    'How a Suavius Atelier piece is made - from FR4 fiberglass and ENIG gold-plated copper to laser-engraved hardwood. Designed in Bielawa, produced with trusted partners.',
}

export default function MaterialsPage() {
  return (
    <article className="max-w-7xl mx-auto px-6 py-16 md:py-24">
      <Breadcrumbs home items={[{ label: 'Materials' }]} className="mb-8" />
      <header className="max-w-3xl mb-16">
        <p className="text-xs uppercase tracking-[0.25em] text-copper mb-4">
          Materials & Process
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-dark leading-tight">
          A piece of the future, finished like an heirloom.
        </h1>
        <p className="mt-6 text-lg text-ink leading-relaxed">
          Every Suavius Atelier object starts as a drawing in our studio and ends in your hand
          as something quietly engineered. Here is how we make it, and what it is actually
          made of.
        </p>
      </header>

      <section className="grid md:grid-cols-[1fr_2fr] gap-8 md:gap-16 mb-20 md:mb-24">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-copper mb-3">01</p>
          <h2 className="font-display text-3xl text-dark">FR4 fiberglass.</h2>
        </div>
        <div className="prose prose-lg max-w-none text-ink">
          <p>
            FR4 is the substrate used in high-reliability electronics - satellites,
            medical devices, fine audio. It is a glass-fibre laminate bonded with epoxy resin,
            cured under pressure. It does not warp. It does not stain. It survives heat from a
            fresh espresso and the next decade of weekday mornings.
          </p>
          <p>
            We chose it because a coaster is a small thing that lives a long life. The same
            substrate that holds a circuit together for twenty years should hold a cup for
            longer.
          </p>
        </div>
      </section>

      <section className="grid md:grid-cols-[1fr_2fr] gap-8 md:gap-16 mb-20 md:mb-24">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-copper mb-3">02</p>
          <h2 className="font-display text-3xl text-dark">ENIG gold-plated copper.</h2>
        </div>
        <div className="prose prose-lg max-w-none text-ink">
          <p>
            The thin gold border on every PCB piece is not paint. It is the actual edge
            of the copper layer beneath, plated with electroless nickel and immersion gold
            (ENIG) - the same finish used on fine-pitch electronics where corrosion is not
            an option.
          </p>
          <p>
            ENIG is more expensive than the alternatives (HASL, lead-based finishes,
            organic coatings). It also ages with grace: where a lacquered metal tarnishes
            within a year, an ENIG surface remains the colour you bought it on.
          </p>
        </div>
      </section>

      <section className="grid md:grid-cols-[1fr_2fr] gap-8 md:gap-16 mb-20 md:mb-24">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-copper mb-3">03</p>
          <h2 className="font-display text-3xl text-dark">UV silkscreen print.</h2>
        </div>
        <div className="prose prose-lg max-w-none text-ink">
          <p>
            The artwork on each PCB piece is printed with multicolour UV-cured silkscreen,
            a process available in production-grade PCB fabrication only since 2024. The
            ink bonds to the resin surface and cures under ultraviolet light into a film
            that does not fade in sunlight and does not lift in dishwater.
          </p>
          <p>
            We draw each design in our studio, refine the colour separations, and supply
            the artwork alongside the Gerber files our manufacturer uses to plate the
            copper. The two layers - graphic and metal - are laid down in separate passes
            and meet only on the finished board.
          </p>
        </div>
      </section>

      <section className="grid md:grid-cols-[1fr_2fr] gap-8 md:gap-16 mb-20 md:mb-24">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-copper mb-3">04</p>
          <h2 className="font-display text-3xl text-dark">Hardwood &amp; laser.</h2>
        </div>
        <div className="prose prose-lg max-w-none text-ink">
          <p>
            Our wooden pieces are cut from European hardwoods - oak, walnut, beech - and
            finished with food-safe linseed oil. Patterns are burned into the surface
            with a CO₂ laser. No ink. No lacquer. The grain shows through every mark,
            and the colour deepens with use rather than chipping away.
          </p>
          <p>
            Wood is, in some respects, the opposite of FR4: it ages visibly. We think
            that is a feature.
          </p>
        </div>
      </section>

      <section className="border-t border-warm-mid pt-16 mt-16">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.25em] text-copper mb-4">Where it&apos;s made</p>
          <h2 className="font-display text-3xl md:text-4xl text-dark leading-tight mb-6">
            Designed in Bielawa. Manufactured by people who do nothing else.
          </h2>
          <div className="prose prose-lg max-w-none text-ink">
            <p>
              We design and finish every piece in our small studio in Bielawa, in the
              Lower Silesia region of Poland. Each PCB is fabricated by a specialist
              partner in Shenzhen - the city that has become the world&apos;s reference for
              precision board manufacturing - to the same tolerances as professional
              electronics.
            </p>
            <p>
              We do not pretend to plate gold ourselves in a back room. We chose this
              workflow because it puts the right tools in the right hands: industrial
              metallurgy where it belongs, and design, finishing, packaging, and
              correspondence with you where they belong - here, in our atelier.
            </p>
            <p>
              Wood pieces are cut and engraved entirely in-house.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 bg-dark text-warm hover:bg-copper transition-colors text-sm tracking-wide"
            >
              See the pieces
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center px-6 py-3 border border-dark/20 hover:border-copper hover:text-copper transition-colors text-sm tracking-wide"
            >
              About the atelier
            </Link>
          </div>
        </div>
      </section>
    </article>
  )
}
