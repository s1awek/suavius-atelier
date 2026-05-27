'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'
import {
  DEFAULT_SORT,
  MATERIAL_LABELS,
  MATERIALS,
  SORT_OPTIONS,
  type SortKey,
} from '@/lib/product-query'

type Updates = Record<string, string | null>

const inputCls =
  'px-3 py-2 bg-warm border border-warm-mid focus:border-dark focus:outline-none text-sm'
const labelCls = 'text-xs uppercase tracking-[0.15em] text-ink-muted'

/**
 * Top-bar product search/filter/sort controls. URL-driven: every change is
 * written to the query string so listings stay SSR-rendered, linkable and
 * shareable. Used on /products, /categories/[slug] and /collections/[slug].
 *
 * Free-text inputs (search, price) are controlled so typing is smooth and the
 * URL update never remounts/steals focus. Price auto-applies on a short debounce
 * (no need to press the search button); search applies on submit (Go / Enter).
 */
export function ProductFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentMaterial = searchParams.get('material') ?? ''
  const currentSort = (searchParams.get('sort') as SortKey | null) ?? DEFAULT_SORT
  const inStock = searchParams.get('inStock') === '1'

  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') ?? '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '')

  const pushUpdates = useCallback(
    (updates: Updates) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value == null || value === '') params.delete(key)
        else params.set(key, value)
      }
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  // Auto-apply price ~500ms after the visitor stops typing, so the filter works
  // without reaching for the search button.
  const priceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const commitPriceDebounced = useCallback(
    (min: string, max: string) => {
      if (priceTimer.current) clearTimeout(priceTimer.current)
      priceTimer.current = setTimeout(() => {
        pushUpdates({ minPrice: min || null, maxPrice: max || null })
      }, 500)
    },
    [pushUpdates],
  )

  function applyText(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (priceTimer.current) clearTimeout(priceTimer.current)
    pushUpdates({ q: q.trim() || null, minPrice: minPrice || null, maxPrice: maxPrice || null })
  }

  function clearAll() {
    if (priceTimer.current) clearTimeout(priceTimer.current)
    setQ('')
    setMinPrice('')
    setMaxPrice('')
    router.push(pathname, { scroll: false })
  }

  const searchInputRef = useRef<HTMLInputElement>(null)
  function clearSearch() {
    setQ('')
    pushUpdates({ q: null })
    searchInputRef.current?.focus()
  }

  const anyActive = Boolean(
    q || minPrice || maxPrice || currentMaterial || inStock || currentSort !== DEFAULT_SORT,
  )

  return (
    <form
      onSubmit={applyText}
      role="search"
      className="mb-10 flex flex-wrap items-end gap-x-4 gap-y-3 border-b border-warm-mid pb-6"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="product-search" className={labelCls}>
          Search
        </label>
        <div className="flex gap-2">
          <div className="relative">
            <input
              ref={searchInputRef}
              id="product-search"
              name="q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search pieces…"
              className={`${inputCls} w-44 pr-8`}
            />
            {q && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-5 h-5 text-ink-muted hover:text-copper cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </svg>
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-dark text-warm hover:bg-copper transition-colors text-xs uppercase tracking-wide cursor-pointer"
          >
            Go
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="product-material" className={labelCls}>
          Material
        </label>
        <select
          id="product-material"
          value={currentMaterial}
          onChange={(e) => pushUpdates({ material: e.target.value || null })}
          className={`${inputCls} cursor-pointer`}
        >
          <option value="">All</option>
          {MATERIALS.map((m) => (
            <option key={m} value={m}>
              {MATERIAL_LABELS[m]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <span className={labelCls}>Price (€)</span>
        <div className="flex items-center gap-2">
          <input
            name="minPrice"
            type="number"
            min={0}
            inputMode="numeric"
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value)
              commitPriceDebounced(e.target.value, maxPrice)
            }}
            placeholder="Min"
            aria-label="Minimum price in euros"
            className={`${inputCls} w-20`}
          />
          <span className="text-ink-muted text-sm">–</span>
          <input
            name="maxPrice"
            type="number"
            min={0}
            inputMode="numeric"
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value)
              commitPriceDebounced(minPrice, e.target.value)
            }}
            placeholder="Max"
            aria-label="Maximum price in euros"
            className={`${inputCls} w-20`}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink cursor-pointer select-none pb-2">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(e) => pushUpdates({ inStock: e.target.checked ? '1' : null })}
          className="accent-copper cursor-pointer"
        />
        In stock only
      </label>

      <div className="flex flex-col gap-1 sm:ml-auto">
        <label htmlFor="product-sort" className={labelCls}>
          Sort
        </label>
        <select
          id="product-sort"
          value={currentSort}
          onChange={(e) =>
            pushUpdates({ sort: e.target.value === DEFAULT_SORT ? null : e.target.value })
          }
          className={`${inputCls} cursor-pointer`}
        >
          {Object.entries(SORT_OPTIONS).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {anyActive && (
        <button
          type="button"
          onClick={clearAll}
          className="pb-2 text-xs uppercase tracking-wide text-ink-muted hover:text-copper transition-colors cursor-pointer underline"
        >
          Clear
        </button>
      )}
    </form>
  )
}
