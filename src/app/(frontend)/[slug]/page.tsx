import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { applyRedirect } from '@/lib/redirects'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Page } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { NOINDEX_SLUGS } from '@/lib/seo'
import { Breadcrumbs } from '@/components/Breadcrumbs'

type Params = { slug: string }

export const revalidate = 600

async function fetchPage(slug: string): Promise<Page | null> {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
    // In draft mode return the latest (unpublished) version and bypass the
    // published-only access gate; otherwise the public sees published only.
    draft,
    overrideAccess: draft,
  })
  return result.docs[0] ?? null
}

// Prerender every DB-backed page at build time so client navigation is instant
// (the RSC payload is prefetched) and the route-group loading.tsx never flashes.
// Slugs added later still render on demand (dynamicParams defaults to true) and cache.
export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const result = await payload.find({ collection: 'pages', limit: 100, depth: 0 })
  return result.docs.flatMap((p) => (p.slug ? [{ slug: p.slug }] : []))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const page = await fetchPage(slug)
  if (!page) return { title: 'Page not found' }
  return {
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? undefined,
    ...(NOINDEX_SLUGS.has(slug) ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function StaticPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const page = await fetchPage(slug)
  if (!page) {
    await applyRedirect(`/${slug}`)
    notFound()
  }

  return (
    <article className="max-w-7xl mx-auto px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <Breadcrumbs home items={[{ label: page.title }]} className="mb-8" />
        <h1 className="font-display text-4xl md:text-5xl text-dark mb-8">{page.title}</h1>
        {page.content ? (
          <div className="prose prose-lg max-w-none text-ink">
            <RichText data={page.content} />
          </div>
        ) : null}
      </div>
    </article>
  )
}
