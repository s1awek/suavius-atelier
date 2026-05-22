import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Page } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { ContactForm } from '@/components/ContactForm'
import { LocationMap } from '@/components/LocationMap'

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

export async function generateMetadata() {
  const page = await fetchContactPage()
  return {
    title: page?.seoTitle ?? page?.title ?? 'Contact',
    description:
      page?.seoDescription ??
      'Get in touch with Suavius Atelier - based in Bielawa, Poland. We respond within 1-2 business days.',
  }
}

const PUBLIC_CONTACT_EMAIL = 'orders@suaviusatelier.com'

export default async function ContactPage() {
  const page = await fetchContactPage()

  return (
    <article className="max-w-6xl mx-auto px-6 py-16">
      <header className="max-w-3xl mb-12">
        <h1 className="font-display text-4xl md:text-5xl text-dark mb-6">
          {page?.title ?? 'Contact'}
        </h1>
        {page?.content && (
          <div className="prose prose-lg max-w-none text-ink">
            <RichText data={page.content} />
          </div>
        )}
      </header>

      <div className="grid gap-12 md:grid-cols-5">
        <section className="md:col-span-2">
          <h2 className="font-display text-2xl mb-6">Write to us</h2>
          <ContactForm />
        </section>

        <aside className="md:col-span-3 space-y-8">
          <div>
            <h2 className="font-display text-2xl mb-4">Where to find us</h2>
            <LocationMap />
          </div>

          <div className="text-sm space-y-1.5">
            <p className="text-xs uppercase tracking-wider text-ink-muted mb-2">Direct</p>
            <p>
              <a href={`mailto:${PUBLIC_CONTACT_EMAIL}`} className="hover:text-copper">
                {PUBLIC_CONTACT_EMAIL}
              </a>
            </p>
            <p className="text-ink-muted">Bielawa, Lower Silesia, Poland</p>
          </div>

          <div className="text-xs text-ink-muted leading-relaxed border-t border-warm-mid pt-5">
            We typically respond within 1-2 business days. For order-related questions, please
            include your order number.
          </div>
        </aside>
      </div>
    </article>
  )
}
