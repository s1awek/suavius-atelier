import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { applyRedirect } from '@/lib/redirects'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Page } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { NOINDEX_SLUGS } from '@/lib/seo'
import Image from 'next/image'
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

  const isAbout = slug === 'about'
  const aside = isAbout ? await fetchAboutImage() : null

  return (
    <article className="max-w-7xl mx-auto px-6 pt-10 pb-16 md:pt-12">
      <Breadcrumbs home items={[{ label: page.title }]} className="mb-8" />
      <h1 className="text-4xl md:text-6xl text-dark leading-[1.02] max-w-4xl">
        {isAbout ? (
          <>
            About the <em className="text-copper">atelier.</em>
          </>
        ) : (
          <AccentTitle title={page.title} />
        )}
      </h1>
      <div className={`mt-10 md:mt-14 grid gap-12 ${aside ? 'md:grid-cols-12' : ''}`}>
        {page.content ? (
          <div
            className={`prose prose-lg max-w-[62ch] text-ink ${
              aside ? 'md:col-span-7' : ''
            }`}
          >
            <RichText data={page.content} />
          </div>
        ) : null}
        {aside && (
          <figure className="md:col-span-5 md:col-start-8 md:sticky md:top-8 self-start">
            <div className="relative aspect-square bg-board">
              <Image
                src={aside.url}
                alt={aside.alt}
                fill
                sizes="(max-width: 768px) 100vw, 38vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 text-sm text-ink-muted">
              A finished board on our bench in Bielawa, before it goes out.
            </figcaption>
          </figure>
        )}
      </div>
    </article>
  )
}

/** Page titles get the same accent as every other heading: the last word in italic. */
function AccentTitle({ title }: { title: string }) {
  const match = title.match(/^(.*?)(\S+)$/)
  if (!match) return <>{title}</>
  return (
    <>
      {match[1]}
      <em className="text-copper">{match[2].replace(/\.$/, '')}.</em>
    </>
  )
}

// The About page sits beside a still from our own bench footage.
async function fetchAboutImage(): Promise<{ url: string; alt: string } | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    where: { slug: { equals: 'autumn-forest-pcb-coaster' } },
    depth: 1,
    limit: 1,
    overrideAccess: false,
  })
  const poster = docs[0]?.video?.poster
  return typeof poster === 'object' && poster?.url
    ? { url: poster.url, alt: poster.alt ?? 'A coaster held in white cotton gloves' }
    : null
}
