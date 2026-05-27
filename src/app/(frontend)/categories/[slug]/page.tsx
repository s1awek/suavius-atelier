import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { applyRedirect } from '@/lib/redirects'
import { getPayloadClient } from '@/lib/payload'
import { ProductCard } from '@/components/ProductCard'
import { Breadcrumbs } from '@/components/Breadcrumbs'

type Params = { slug: string }

export const revalidate = 300

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://suaviusatelier.com'

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const category = result.docs[0]
  return { title: category ? category.title : 'Category not found' }
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const payload = await getPayloadClient()

  const catResult = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const category = catResult.docs[0]
  if (!category) {
    await applyRedirect(`/categories/${slug}`)
    notFound()
  }

  const products = await payload.find({
    collection: 'products',
    where: {
      and: [
        { status: { equals: 'active' } },
        { category: { equals: category.id } },
      ],
    },
    limit: 100,
    sort: '-updatedAt',
  })

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Shop', item: `${SITE_URL}/products` },
      {
        '@type': 'ListItem',
        position: 2,
        name: category.title,
        item: `${SITE_URL}/categories/${category.slug}`,
      },
    ],
  }

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Breadcrumbs
        items={[
          { label: 'Shop', href: '/products' },
          { label: category.title },
        ]}
        className="mb-8"
      />
      <div className="mb-12">
        <p className="text-xs uppercase tracking-[0.2em] text-copper mb-4">Category</p>
        <h1 className="text-4xl md:text-5xl">{category.title}</h1>
        {category.description && (
          <p className="mt-4 max-w-2xl text-ink-muted">{category.description}</p>
        )}
      </div>

      {products.docs.length === 0 ? (
        <p className="text-ink-muted">No products in this category yet.</p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.docs.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  )
}
