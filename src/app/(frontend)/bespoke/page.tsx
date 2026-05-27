import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/Breadcrumbs'

export const metadata: Metadata = {
  title: 'Bespoke & Custom Orders',
  description:
    'Commission a one-of-a-kind PCB or wood piece from Suavius Atelier - custom artwork, engraved names, corporate logos, wedding sets, and limited editions.',
}

export default function BespokePage() {
  return (
    <article className="max-w-7xl mx-auto px-6 py-16 md:py-24">
      <Breadcrumbs home items={[{ label: 'Bespoke' }]} className="mb-8" />
      <header className="max-w-3xl mb-16">
        <p className="text-xs uppercase tracking-[0.3em] text-copper mb-4">Commissions</p>
        <h1 className="font-display text-4xl md:text-5xl text-dark leading-tight">
          One piece, made for you.
        </h1>
        <p className="mt-6 text-lg text-ink-muted leading-relaxed">
          We accept a small number of bespoke commissions each month. Wedding gifts, corporate
          editions, monogrammed wood pieces, custom artwork on PCB - if it can be drawn and
          fabricated to our standards, we will quote it.
        </p>
      </header>

      <section className="grid md:grid-cols-3 gap-10 mb-20">
        <div>
          <p className="font-display text-3xl text-copper mb-3">01</p>
          <h3 className="font-display text-xl text-dark mb-2">Write to us</h3>
          <p className="text-ink-muted text-sm leading-relaxed">
            Send your idea, a sketch or reference image, the quantity, and when you need it
            by. The more we know, the more useful our first reply will be.
          </p>
        </div>
        <div>
          <p className="font-display text-3xl text-copper mb-3">02</p>
          <h3 className="font-display text-xl text-dark mb-2">Proposal &amp; quote</h3>
          <p className="text-ink-muted text-sm leading-relaxed">
            Within two business days we send a written proposal: design direction, materials,
            unit price, total, and a realistic timeline. There is no charge for this stage.
          </p>
        </div>
        <div>
          <p className="font-display text-3xl text-copper mb-3">03</p>
          <h3 className="font-display text-xl text-dark mb-2">Make &amp; deliver</h3>
          <p className="text-ink-muted text-sm leading-relaxed">
            Once you approve a digital proof, we begin. PCB commissions ship in three to four
            weeks. Wood commissions in one to two. Tracked and insured worldwide.
          </p>
        </div>
      </section>

      <section className="border-t border-warm-mid pt-16 mb-20">
        <h2 className="font-display text-3xl md:text-4xl text-dark mb-8">
          What we make.
        </h2>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 text-ink">
          <BespokeItem
            title="Personalised PCB"
            body="Custom artwork on FR4 with ENIG gold edge. Wedding dates, family monograms, anniversary motifs, illustrations from your photographs. Minimum order: 5 pieces."
          />
          <BespokeItem
            title="Corporate editions"
            body="Branded coasters, desk objects, and welcome kits for offices, conferences, and gifting. Engraved or printed with your wordmark. Minimum order: 25 pieces."
          />
          <BespokeItem
            title="Engraved wood"
            body="Monogrammed coasters, trivets, headphone stands, and trays in oak, walnut, or beech. Names, initials, logos, or simple motifs. Minimum order: 1 piece."
          />
          <BespokeItem
            title="Regional editions"
            body="Maps of cities, regions, ski runs, hiking trails, sailing routes - drawn for a place that matters to someone. PCB or wood, single piece or a small run."
          />
          <BespokeItem
            title="Wedding sets"
            body="Coordinated coasters, place cards, or table numbers for the day, and matching keepsakes for guests. We work directly with you or your planner."
          />
          <BespokeItem
            title="Something else"
            body="If you are not sure whether we can make it, ask. We will be honest about what is and is not possible at our scale."
          />
        </div>
      </section>

      <section className="border-t border-warm-mid pt-16">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
          <div>
            <h2 className="font-display text-3xl md:text-4xl text-dark leading-tight mb-6">
              Start a commission.
            </h2>
            <p className="text-ink-muted leading-relaxed mb-8">
              Use the contact form, or write directly. Please include the briefest possible
              description, any references, quantity, deadline, and budget if you have one in
              mind.
            </p>
            <Link
              href="/contact?subject=Bespoke%20enquiry"
              className="inline-flex items-center px-6 py-3 bg-dark text-warm hover:bg-copper transition-colors text-sm tracking-wide"
            >
              Open contact form
            </Link>
          </div>
          <div className="text-sm space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-ink-muted mb-3">Direct</p>
            <p>
              <a href="mailto:orders@suaviusatelier.com" className="hover:text-copper">
                orders@suaviusatelier.com
              </a>
            </p>
            <p className="text-ink-muted">Reply within two business days.</p>
            <p className="text-ink-muted pt-4 text-xs leading-relaxed">
              For commissions above 100 units or with a deadline under three weeks, please
              mention it in the first line so we can prioritise the reply.
            </p>
          </div>
        </div>
      </section>
    </article>
  )
}

function BespokeItem({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-display text-xl text-dark mb-2">{title}</h3>
      <p className="text-ink-muted text-sm leading-relaxed">{body}</p>
    </div>
  )
}
