import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Page } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'

type Params = { slug: string }

async function fetchPage(slug: string): Promise<Page | null> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  return result.docs[0] ?? null
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const page = await fetchPage(slug)
  if (!page) return { title: 'Page not found' }
  return {
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? undefined,
  }
}

export default async function StaticPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const page = await fetchPage(slug)
  if (!page) notFound()

  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-display text-4xl md:text-5xl text-dark mb-8">{page.title}</h1>
      {page.content ? (
        <div className="prose prose-lg max-w-none text-ink">
          <RichText data={page.content} />
        </div>
      ) : null}
    </article>
  )
}
