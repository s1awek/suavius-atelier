import { getPayloadClient } from '@/lib/payload'
import { ProductCard } from '@/components/ProductCard'

export const metadata = { title: 'Shop' }

export const revalidate = 300

export default async function ProductsPage() {
  const payload = await getPayloadClient()

  const result = await payload.find({
    collection: 'products',
    where: { status: { equals: 'active' } },
    limit: 100,
    sort: '-updatedAt',
  })

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="mb-12">
        <p className="text-xs uppercase tracking-[0.2em] text-copper mb-4">All pieces</p>
        <h1 className="text-4xl md:text-5xl">Shop</h1>
      </div>

      {result.docs.length === 0 ? (
        <p className="text-ink-muted">No products available yet.</p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {result.docs.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  )
}
