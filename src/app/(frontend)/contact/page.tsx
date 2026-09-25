import type { Metadata } from 'next'
import Image from 'next/image'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Page } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { ContactForm } from '@/components/ContactForm'
import { Breadcrumbs } from '@/components/Breadcrumbs'

export const revalidate = 600

async function fetchContactPage(): Promise<Page | null> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'contact' } },
    limit: 1,
  })
  return result.docs[0] ?? null
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchContactPage()
  return {
    title: page?.seoTitle ?? page?.title ?? 'Contact',
    description:
      page?.seoDescription ??
      'Get in touch with Suavius Atelier - based in Bielawa, Poland. We respond within 1-2 business days.',
  }
}

const PUBLIC_CONTACT_EMAIL = 'orders@suaviusatelier.com'

// A still from our own bench footage, shown beside the form.
async function fetchBenchStill(): Promise<{ url: string; alt: string } | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    where: { slug: { equals: 'gold-rings-pcb-coaster' } },
    depth: 1,
    limit: 1,
    overrideAccess: false,
  })
  const poster = docs[0]?.video?.poster
  return typeof poster === 'object' && poster?.url
    ? { url: poster.url, alt: poster.alt ?? 'A coaster held in white cotton gloves' }
    : null
}

export default async function ContactPage() {
  const [page, still] = await Promise.all([fetchContactPage(), fetchBenchStill()])

  return (
    <article className="max-w-7xl mx-auto px-6 pt-10 pb-16 md:pt-12">
      <Breadcrumbs home items={[{ label: 'Contact' }]} className="mb-8" />
      <header className="grid gap-10 md:grid-cols-12 md:items-end mb-14 md:mb-20">
        <div className="md:col-span-7">
          <h1 className="text-4xl md:text-6xl text-dark leading-[1.02]">
            Write to <em className="text-copper">us.</em>
          </h1>
          {page?.content && (
            <div className="prose prose-lg max-w-xl text-ink mt-6">
              <RichText data={page.content} />
            </div>
          )}
        </div>
        <div className="md:col-span-5 md:col-start-8">
          <a
            href={`mailto:${PUBLIC_CONTACT_EMAIL}`}
            className="inline-block py-1 text-2xl md:text-3xl text-dark hover:text-copper transition-colors break-all"
          >
            {PUBLIC_CONTACT_EMAIL}
          </a>
          <p className="mt-3 text-base text-ink-muted leading-relaxed max-w-sm">
            For a question about an order, please include your order number. The studio is in
            Bielawa, Lower Silesia, Poland; visits by appointment.
          </p>
        </div>
      </header>

      <div className="grid gap-14 md:grid-cols-12 md:gap-12 border-t border-dark/15 pt-12 md:pt-16">
        <section className="md:col-span-7" aria-label="Contact form">
          <ContactForm />
        </section>
        {still && (
          <figure className="md:col-span-5 md:col-start-8 self-start">
            <div className="relative aspect-square bg-board">
              <Image
                src={still.url}
                alt={still.alt}
                fill
                sizes="(max-width: 768px) 100vw, 38vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 text-sm text-ink-muted">
              Our bench in Bielawa, where every order is checked and packed.
            </figcaption>
          </figure>
        )}
      </div>
    </article>
  )
}
