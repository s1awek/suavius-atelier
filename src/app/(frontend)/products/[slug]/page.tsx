import { notFound } from 'next/navigation'
import Image from 'next/image'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Media, Product } from '@/payload-types'
import { getPayloadClient, formatPrice } from '@/lib/payload'
import { AddToCartButton } from '@/components/AddToCartButton'

type Params = { slug: string }

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

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const product = await fetchProduct(slug)
  if (!product) return { title: 'Product not found' }
  return {
    title: product.seoTitle ?? product.title,
    description: product.seoDescription ?? undefined,
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

  return (
    <article className="max-w-7xl mx-auto px-6 py-16">
      <div className="grid gap-12 md:grid-cols-2">
        <div className="space-y-4">
          {images.length === 0 ? (
            <div className="aspect-square bg-warm-mid flex items-center justify-center text-ink-muted text-sm">
              [no images]
            </div>
          ) : (
            <>
              <div className="aspect-square bg-warm-mid relative overflow-hidden">
                {images[0].url && (
                  <Image
                    src={images[0].url}
                    alt={images[0].alt ?? product.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    priority
                  />
                )}
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {images.slice(1).map((img) => (
                    <div key={img.id} className="aspect-square bg-warm-mid relative overflow-hidden">
                      {img.url && (
                        <Image
                          src={img.url}
                          alt={img.alt ?? product.title}
                          fill
                          sizes="120px"
                          className="object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
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

          <AddToCartButton
            productId={product.id}
            title={product.title}
            slug={product.slug ?? ''}
            price={product.price}
            imageUrl={images[0]?.url ?? null}
            currency="EUR"
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
        </div>
      </div>
    </article>
  )
}
