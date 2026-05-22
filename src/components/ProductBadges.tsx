import type { Product } from '@/payload-types'

type Props = {
  product: Pick<Product, 'isNew' | 'isBestseller'>
  className?: string
}

export function ProductBadges({ product, className = '' }: Props) {
  const labels: string[] = []
  if (product.isNew) labels.push('New')
  if (product.isBestseller) labels.push('Bestseller')

  if (labels.length === 0) return null

  return (
    <span
      className={`text-[10px] uppercase tracking-[0.25em] text-ink-muted ${className}`}
    >
      {labels.join(' · ')}
    </span>
  )
}
