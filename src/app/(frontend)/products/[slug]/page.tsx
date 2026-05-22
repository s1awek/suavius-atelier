import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Media, Product } from '@/payload-types'
import { getPayloadClient, formatPrice } from '@/lib/payload'
import { ProductPurchasePanel } from '@/components/ProductPurchasePanel'
import { ProductGallery, type GalleryImage } from '@/components/ProductGallery'
import { RelatedProducts } from '@/components/RelatedProducts'
import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs'
import { ShareButtons } from '@/components/ShareButtons'

type Params = { slug: string }

export const revalidate = 300

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://suaviusatelier.com'

async function fetchProduct(slug: string): Promise<Product | null> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'products',
    where: {
      and: [{ slug: { equals: slug } }, { status: { equals: 'active' } }],
    },
    limit: 1,
    depth: 2,
  })
  return result.docs[0] ?? null
}

async function fetchRelated(currentId: number, categoryId: number | null): Promise<Product[]> {
  if (!categoryId) return []
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'products',
    where: {
      and: [
        { status: { equals: 'active' } },
        { category: { equals: categoryId } },
        { id: { not_equals: currentId } },
      ],
    },
    limit: 4,
    depth: 1,
  })
  return result.docs
}

function fallbackDescription(product: Product): string {
  const materialLabel =
    product.material === 'pcb'
      ? 'hand-designed PCB'
      : product.material === 'wood'
        ? 'laser-engraved wood'
        : 'handcrafted'
  return `${product.title} - a ${materialLabel} piece from Suavius Atelier. Hand-finished, made in small batches, shipped from Poland to anywhere in Europe.`
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const product = await fetchProduct(slug)
  if (!product) return { title: 'Product not found' }
  const url = `${SITE_URL}/products/${product.slug}`
  const title = product.seoTitle ?? product.title
  const description = product.seoDescription ?? fallbackDescription(product)
  const brandedTitle = `${title} · Suavius Atelier`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: brandedTitle,
      description,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: brandedTitle,
      description,
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const product = await fetchProduct(slug)
  if (!product) notFound()

  const images: Media[] = (product.images ?? [])
    .map((row) => row.image)
    .filter((m): m is Media => typeof m === 'object' && m !== null)

  const onSale =
    typeof product.compareAtPrice === 'number' && product.compareAtPrice > product.price

  const productUrl = `${SITE_URL}/products/${product.slug}`
  const totalStock = (product.variants ?? []).reduce(
    (sum, v) => sum + (typeof v.stock === 'number' ? v.stock : 0),
    0,
  )
  const inStock = (product.variants ?? []).length === 0 || totalStock > 0

  const category =
    product.category && typeof product.category === 'object' ? product.category : null

  const related = await fetchRelated(product.id, category?.id ?? null)

  const breadcrumbItems: Array<{ name: string; url: string }> = [
    { name: 'Shop', url: `${SITE_URL}/products` },
  ]
  if (category?.slug && category?.title) {
    breadcrumbItems.push({ name: category.title, url: `${SITE_URL}/categories/${category.slug}` })
  }
  breadcrumbItems.push({ name: product.title, url: productUrl })

  const jsonLd = [
    {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.title,
      description:
        product.seoDescription ??
        `${product.title} by Suavius Atelier - hand-designed ${product.material === 'pcb' ? 'PCB' : product.material === 'wood' ? 'wood' : ''} accessory.`,
      image: images.map((img) => img.url).filter(Boolean),
      url: productUrl,
      brand: { '@type': 'Brand', name: 'Suavius Atelier' },
      offers: {
        '@type': 'Offer',
        url: productUrl,
        priceCurrency: 'EUR',
        price: (product.price / 100).toFixed(2),
        availability: inStock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
      },
    },
    {
      '@context': 'https://schema.org/',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems.map((b, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: b.name,
        item: b.url,
      })),
    },
  ]

  const visibleBreadcrumbs: Crumb[] = [
    { label: 'Shop', href: '/products' },
    ...(category?.slug && category?.title
      ? [{ label: category.title, href: `/categories/${category.slug}` }]
      : []),
    { label: product.title },
  ]

  return (
    <article className="max-w-7xl mx-auto px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs items={visibleBreadcrumbs} className="mb-8" />
      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <ProductGallery
            images={images
              .filter((img): img is Media & { url: string } => Boolean(img.url))
              .map<GalleryImage>((img) => ({
                id: img.id,
                url: img.url,
                alt: img.alt ?? product.title,
              }))}
            productTitle={product.title}
          />
        </div>

        <div>
          <h1 className="text-4xl md:text-5xl">{product.title}</h1>

          <div className="mt-4 text-xl">
            {onSale && (
              <span className="line-through text-ink-muted mr-3">
                {formatPrice(product.compareAtPrice!)}
              </span>
            )}
            <span>{formatPrice(product.price)}</span>
          </div>

          {product.description && (
            <div className="prose prose-neutral mt-8 max-w-none text-ink">
              <RichText data={product.description} />
            </div>
          )}

          <ProductPurchasePanel
            productId={product.id}
            title={product.title}
            slug={product.slug ?? ''}
            price={product.price}
            imageUrl={images[0]?.url ?? null}
            currency="EUR"
            variants={(product.variants ?? []).map((v) => ({
              name: v.name,
              sku: v.sku,
              stock: typeof v.stock === 'number' ? v.stock : 0,
            }))}
          />

          {(product.weightGrams ||
            product.dimensions?.widthMm ||
            product.dimensions?.heightMm ||
            product.dimensions?.depthMm) && (
            <dl className="mt-12 grid grid-cols-2 gap-4 text-sm border-t border-warm-mid pt-6">
              {product.weightGrams && (
                <>
                  <dt className="text-ink-muted">Weight</dt>
                  <dd>{product.weightGrams} g</dd>
                </>
              )}
              {(product.dimensions?.widthMm ||
                product.dimensions?.heightMm ||
                product.dimensions?.depthMm) && (
                <>
                  <dt className="text-ink-muted">Dimensions</dt>
                  <dd>
                    {[
                      product.dimensions?.widthMm,
                      product.dimensions?.heightMm,
                      product.dimensions?.depthMm,
                    ]
                      .filter(Boolean)
                      .join(' × ')}{' '}
                    mm
                  </dd>
                </>
              )}
            </dl>
          )}

          <ShareButtons
            url={productUrl}
            title={product.title}
            imageUrl={images[0]?.url ? `${SITE_URL}${images[0].url}` : null}
          />
        </div>
      </div>

      <RelatedProducts products={related} />
    </article>
  )
}
