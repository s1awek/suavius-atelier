import type { Metadata } from 'next'
import Image from 'next/image'
import type { Media } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { ContactForm } from '@/components/ContactForm'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Bespoke & Custom Orders',
  description:
    'Commission circuit board coasters with your own picture or mark from Suavius Atelier: personal gifts, company editions, wedding sets and places that matter.',
}

// Real shots of one finished piece: a still from our bench footage for the header, and its
// gold reverse beside the list of what we make.
async function fetchShots(): Promise<{ bench: Media | null; reverse: Media | null }> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    where: { slug: { equals: 'tennis-court-pcb-coaster' } },
    depth: 1,
    limit: 1,
    overrideAccess: false,
  })
  const product = docs[0]
  const poster = product?.video?.poster
  const reverse = (product?.images ?? [])
    .map((i) => i.image)
    .find((m): m is Media => typeof m === 'object' && !!m?.url && !!m.filename?.includes('reverse-2'))
  return {
    bench: typeof poster === 'object' && poster?.url ? poster : null,
    reverse: reverse ?? null,
  }
}

const STEPS = [
  {
    title: 'Write to us',
    body: 'Send your idea, a sketch or reference image, the quantity, and when you need it by. The more we know, the more useful our first reply will be.',
  },
  {
    title: 'Proposal and quote',
    body: 'Within two business days we send a written proposal with the design direction, unit price, total and a realistic timeline. This stage is free.',
  },
  {
    title: 'Make and deliver',
    body: 'Once you approve a digital proof, the boards go into production. PCB commissions ship in three to four weeks, tracked and insured.',
  },
]

const OFFERS = [
  {
    title: 'Personal pieces',
    body: 'Your picture on the front: a wedding date, a family monogram, an illustration from a photograph. Minimum order 5 pieces.',
  },
  {
    title: 'Company editions',
    body: 'Your wordmark printed on the front or plated in gold on the reverse, for offices, conferences and client gifts. Minimum order 25 pieces.',
  },
  {
    title: 'Places',
    body: 'A city, a ski run, a hiking trail or a sailing route, drawn for someone who knows it by heart. A single set or a small run.',
  },
  {
    title: 'Wedding sets',
    body: 'Coasters for the tables and a matching keepsake for the guests. We work with you directly or with your planner.',
  },
  {
    title: 'Solid ash',
    body: 'Plain ash coasters in the quantity you need, oiled and waxed. A gold-foil mark is in preparation; ask if you would like one.',
  },
  {
    title: 'Something else',
    body: 'If you are not sure whether we can make it, ask. We will be honest about what is and is not possible at our scale.',
  },
]

export default async function BespokePage() {
  const { bench, reverse } = await fetchShots()

  return (
    <>
      <header className="max-w-7xl mx-auto px-6 pt-10 pb-16 md:pt-12 md:pb-24 grid gap-10 md:grid-cols-12 md:items-center">
        <div className="md:col-span-6">
          <Breadcrumbs home items={[{ label: 'Bespoke' }]} className="mb-8" />
          <h1 className="text-4xl md:text-6xl text-dark leading-[1.02]">
            Made for <em className="text-copper">you.</em>
          </h1>
          <p className="mt-6 text-lg text-ink leading-relaxed max-w-xl">
            We take a small number of commissions each month. If it can be drawn and made as a
            circuit board to our standard, we will quote it.
          </p>
          <a
            href="#start"
            className="mt-8 inline-flex items-center min-h-12 px-7 border border-dark/25 hover:border-copper hover:text-copper transition-colors"
          >
            Start a commission
          </a>
        </div>
        {bench?.url && (
          <figure className="md:col-span-6">
            <div className="relative aspect-[4/3] md:aspect-square bg-board overflow-hidden">
              <Image
                src={bench.url}
                alt={bench.alt ?? 'A finished coaster held in white cotton gloves'}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 text-sm text-ink-muted">
              Every commission is checked by hand on our bench in Bielawa before it goes out.
            </figcaption>
          </figure>
        )}
      </header>

      <section className="max-w-7xl mx-auto px-6 pb-20 md:pb-28">
        <h2 className="text-4xl md:text-6xl text-dark leading-[1.02] max-w-3xl">
          How it <em className="text-copper">works.</em>
        </h2>
        <ol className="mt-12 md:mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative border-t border-dark/20 pt-6">
              <span
                aria-hidden="true"
                className="absolute -top-[5px] left-0 h-[9px] w-[9px] rounded-full bg-copper"
              />
              <p className="font-mono text-xs text-copper">{String(i + 1).padStart(2, '0')}</p>
              <h3 className="mt-3 text-xl md:text-2xl text-dark">{step.title}</h3>
              <p className="mt-3 text-base text-ink leading-relaxed max-w-sm">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-board text-silk">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <h2 className="text-4xl md:text-6xl leading-[1.02] max-w-3xl">
            What we <em className="text-enig">make.</em>
          </h2>
          <div className="mt-12 md:mt-16 grid gap-12 md:grid-cols-12">
            <dl className="md:col-span-7 grid gap-x-12 sm:grid-cols-2 content-start">
              {OFFERS.map((offer) => (
                <div key={offer.title} className="border-t border-silk/15 py-6">
                  <dt className="text-xl md:text-2xl">{offer.title}</dt>
                  <dd className="mt-2 text-base text-silk-muted leading-relaxed">{offer.body}</dd>
                </div>
              ))}
            </dl>
            {reverse?.url && (
              <figure className="md:col-span-5 md:sticky md:top-8 self-start">
                <div className="relative aspect-square">
                  <Image
                    src={reverse.url}
                    alt={reverse.alt ?? 'Gold reverse of a Suavius Atelier coaster'}
                    fill
                    sizes="(max-width: 768px) 100vw, 38vw"
                    className="object-contain"
                  />
                </div>
                <figcaption className="mt-3 text-sm text-silk-muted">
                  The reverse carries our mark in gold. On a commission it can carry yours.
                </figcaption>
              </figure>
            )}
          </div>
        </div>
      </section>

      <section id="start" className="max-w-7xl mx-auto px-6 pt-20 md:pt-28 scroll-mt-8">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <h2 className="text-4xl md:text-6xl text-dark leading-[1.02]">
              Start a <em className="text-copper">commission.</em>
            </h2>
            <p className="mt-6 text-lg text-ink leading-relaxed max-w-md">
              Tell us what you would like made. We reply to every enquiry personally, within two
              business days.
            </p>
            <div className="mt-10 border-t border-dark/15 pt-6 text-base space-y-2 max-w-md">
              <p className="text-ink-muted">Prefer email?</p>
              <p>
                <a
                  href="mailto:orders@suaviusatelier.com"
                  className="inline-block py-1 text-dark underline underline-offset-4 hover:text-copper"
                >
                  orders@suaviusatelier.com
                </a>
              </p>
              <p className="pt-2 text-sm text-ink-muted leading-relaxed">
                For more than 100 pieces, or a deadline under three weeks, say so in the first
                line and we will reply first.
              </p>
            </div>
          </div>
          <div className="md:col-span-7">
            <ContactForm
              fixedSubject="Bespoke enquiry"
              submitLabel="Send enquiry"
              successTitle="Enquiry received"
              successBody="Thank you, your commission enquiry is in. We reply within two business days with a design direction and a quote."
              messageLabel="Your idea"
              messageHint="A short description, any references, the quantity, your deadline, and a budget if you have one in mind."
            />
          </div>
        </div>
      </section>
    </>
  )
}
