import type { Where } from 'payload'

/**
 * Reusable product search/filter/sort layer.
 *
 * Parses URL searchParams into a normalized filter state, and builds the
 * Payload `where` + `sort` clauses from it. Shared by /products,
 * /categories/[slug] and /collections/[slug] so the listing behaviour stays
 * consistent across the store.
 *
 * Notes on the data model (src/collections/Products.ts):
 * - `price` is stored in MINOR units (e.g. 4900 = 49.00 EUR). The price filter
 *   accepts MAJOR units from the URL (human-friendly) and converts.
 * - `description` is richText (Lexical JSON), so text search runs on `title`
 *   only (`like` -> ILIKE in Postgres).
 * - `totalStock` is a virtual afterRead field and cannot be queried; the
 *   in-stock filter therefore matches on `variants.stock > 0`.
 */

export const MATERIALS = ['pcb', 'wood', 'other'] as const
export type Material = (typeof MATERIALS)[number]

export const MATERIAL_LABELS: Record<Material, string> = {
  pcb: 'PCB',
  wood: 'Wood',
  other: 'Other',
}

export const SORT_OPTIONS = {
  newest: { label: 'Newest', sort: '-updatedAt' },
  'price-asc': { label: 'Price: low to high', sort: 'price' },
  'price-desc': { label: 'Price: high to low', sort: '-price' },
  title: { label: 'Name: A-Z', sort: 'title' },
} as const satisfies Record<string, { label: string; sort: string }>

export type SortKey = keyof typeof SORT_OPTIONS
export const DEFAULT_SORT: SortKey = 'newest'

/** Slim product shape returned by the global search API (overlay results + suggestions). */
export type ProductSearchResult = {
  id: number
  title: string
  slug: string
  price: number
  compareAtPrice: number | null
  image: string | null
}

export type ProductFilters = {
  q: string
  material: Material | null
  /** major currency units, as typed in the UI (null = unbounded) */
  minPrice: number | null
  maxPrice: number | null
  inStock: boolean
  sort: SortKey
}

type RawSearchParams = Record<string, string | string[] | undefined>

function firstStr(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

function toPositiveNumber(v: string | undefined): number | null {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export function parseProductFilters(sp: RawSearchParams): ProductFilters {
  const q = (firstStr(sp.q) ?? '').trim()

  const materialRaw = firstStr(sp.material)
  const material = MATERIALS.includes(materialRaw as Material)
    ? (materialRaw as Material)
    : null

  const sortRaw = firstStr(sp.sort)
  const sort = sortRaw && sortRaw in SORT_OPTIONS ? (sortRaw as SortKey) : DEFAULT_SORT

  const inStockRaw = firstStr(sp.inStock)
  const inStock = inStockRaw === '1' || inStockRaw === 'true'

  return {
    q,
    material,
    minPrice: toPositiveNumber(firstStr(sp.minPrice)),
    maxPrice: toPositiveNumber(firstStr(sp.maxPrice)),
    inStock,
    sort,
  }
}

/** True when the user has narrowed the listing in any way beyond defaults. */
export function hasActiveFilters(f: ProductFilters): boolean {
  return Boolean(
    f.q ||
      f.material ||
      f.minPrice != null ||
      f.maxPrice != null ||
      f.inStock ||
      f.sort !== DEFAULT_SORT,
  )
}

/**
 * Build a Payload `where` clause from the parsed filters. `base` is merged in
 * as an additional constraint (e.g. category membership, or an id list for a
 * collection) and is ANDed with the active-status + filter conditions.
 */
export function buildProductWhere(filters: ProductFilters, base?: Where): Where {
  const and: Where[] = [{ status: { equals: 'active' } }]

  if (base) and.push(base)
  if (filters.q) and.push({ title: { like: filters.q } })
  if (filters.material) and.push({ material: { equals: filters.material } })
  if (filters.minPrice != null)
    and.push({ price: { greater_than_equal: Math.round(filters.minPrice * 100) } })
  if (filters.maxPrice != null)
    and.push({ price: { less_than_equal: Math.round(filters.maxPrice * 100) } })
  if (filters.inStock) and.push({ 'variants.stock': { greater_than: 0 } })

  return { and }
}

export function buildProductSort(filters: ProductFilters): string {
  return SORT_OPTIONS[filters.sort].sort
}
