import type { Product } from '@/payload-types'
import { ProductCard } from './ProductCard'

type Props = {
  products: Product[]
}

export function RelatedProducts({ products }: Props) {
  if (products.length === 0) return null

  return (
    <section className="mt-24 border-t border-warm-mid pt-12">
      <h2 className="font-display text-2xl md:text-3xl text-dark mb-8">You may also like</h2>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
