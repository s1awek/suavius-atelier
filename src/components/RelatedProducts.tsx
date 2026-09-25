import type { Product } from '@/payload-types'
import { ProductCard } from './ProductCard'

type Props = {
  products: Product[]
}

export function RelatedProducts({ products }: Props) {
  if (products.length === 0) return null

  return (
    <section className="mt-24 md:mt-32">
      <h2 className="text-4xl md:text-6xl text-dark leading-[1.02] mb-10 md:mb-14">
        More <em className="text-copper">coasters.</em>
      </h2>
      <div className="grid gap-x-4 gap-y-10 md:gap-x-8 grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
