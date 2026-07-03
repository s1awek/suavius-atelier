import type { Product } from '@/payload-types'
import { formatDiameter, formatThickness } from '@/lib/format'

const MATERIAL_LABEL: Partial<Record<NonNullable<Product['material']>, string>> = {
  pcb: 'FR4 fiberglass · ENIG gold finish',
  wood: 'Ash · oiled & waxed',
}

/**
 * Product specs block on the PDP. Dimensions are stored in millimetres; round pieces use the
 * convention `widthMm` = diameter with `heightMm` unset, so we render a diameter (cm + in) plus
 * thickness (mm + in) for both Europe and the US. Rectangular pieces fall back to W × H × D mm.
 */
export function ProductSpecs({ product }: { product: Product }) {
  const d = product.dimensions
  const hasDims = Boolean(d?.widthMm || d?.heightMm || d?.depthMm)
  const isRound = Boolean(d?.widthMm && !d?.heightMm)
  const material = MATERIAL_LABEL[product.material]

  const rows: Array<[string, string]> = []
  if (material) rows.push(['Material', material])
  if (isRound && d?.widthMm) {
    rows.push(['Diameter', formatDiameter(d.widthMm)])
    if (d.depthMm) rows.push(['Thickness', formatThickness(d.depthMm)])
  } else if (hasDims) {
    const dims = [d?.widthMm, d?.heightMm, d?.depthMm].filter(Boolean).join(' × ')
    rows.push(['Dimensions', `${dims} mm`])
  }
  if (product.weightGrams) rows.push(['Weight', `${product.weightGrams} g`])

  if (rows.length === 0) return null

  return (
    <dl className="mt-12 grid grid-cols-2 gap-4 text-sm border-t border-warm-mid pt-6">
      {rows.map(([term, value]) => (
        <div key={term} className="contents">
          <dt className="text-ink-muted">{term}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
