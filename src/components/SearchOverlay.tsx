'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useSearchUI } from '@/lib/search-ui'
import type { ProductSearchResult } from '@/lib/product-query'
import { formatPrice } from '@/lib/format'

const MIN_QUERY = 2
const DEBOUNCE_MS = 250

// Quick-entry chips mapping to existing listing filters.
const CHIPS: { label: string; href: string }[] = [
  { label: 'PCB', href: '/products?material=pcb' },
  { label: 'Wood', href: '/products?material=wood' },
  { label: 'In stock', href: '/products?inStock=1' },
]

type Status = 'idle' | 'loading' | 'done'

export function SearchOverlay() {
  const router = useRouter()
  const isOpen = useSearchUI((s) => s.isOpen)
  const close = useSearchUI((s) => s.close)

  const [query, setQuery] = useState('')
  const [items, setItems] = useState<ProductSearchResult[]>([])
  const [suggestions, setSuggestions] = useState<ProductSearchResult[]>([])
  const [status, setStatus] = useState<Status>('idle')

  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const suggestionsLoaded = useRef(false)

  // Focus, scroll-lock, Esc-to-close, and lazy-load curated suggestions on open.
  useEffect(() => {
    if (!isOpen) return
    inputRef.current?.focus()
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)

    if (!suggestionsLoaded.current) {
      suggestionsLoaded.current = true
      fetch('/api/search')
        .then((r) => r.json())
        .then((d) => setSuggestions(d.items ?? []))
        .catch(() => {})
    }

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, close])

  function runSearch(q: string) {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items ?? [])
        setStatus('done')
      })
      .catch((e) => {
        if (e?.name !== 'AbortError') setStatus('done')
      })
  }

  function onQueryChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = value.trim()
    if (trimmed.length < MIN_QUERY) {
      abortRef.current?.abort()
      setItems([])
      setStatus('idle')
      return
    }
    setStatus('loading')
    debounceRef.current = setTimeout(() => runSearch(trimmed), DEBOUNCE_MS)
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed.length < MIN_QUERY) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    close()
    router.push(`/products?q=${encodeURIComponent(trimmed)}`)
  }

  function clearQuery() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    abortRef.current?.abort()
    setQuery('')
    setItems([])
    setStatus('idle')
    inputRef.current?.focus()
  }

  const hasQuery = query.trim().length >= MIN_QUERY

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search the atelier"
      inert={!isOpen}
      className={`fixed inset-0 z-[70] bg-warm transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between px-6 py-6 border-b border-warm-mid">
          <span className="text-xs uppercase tracking-[0.25em] text-ink-muted">Search</span>
          <button
            type="button"
            onClick={close}
            aria-label="Close search"
            className="inline-flex items-center justify-center w-10 h-10 -mr-2 cursor-pointer hover:text-copper transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
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
        </header>

        <div
          className={`flex-1 overflow-y-auto transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            isOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
          }`}
        >
          <div className="max-w-2xl mx-auto px-6 pt-10 pb-16 sm:pt-16">
            <form onSubmit={onSubmit} role="search">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  placeholder="Search pieces…"
                  aria-label="Search pieces"
                  className="w-full bg-transparent border-b border-warm-mid focus:border-dark focus:outline-none font-display text-3xl md:text-4xl text-dark placeholder:text-ink-muted/50 pb-3 pr-10 transition-colors"
                />
                {query && (
                  <button
                    type="button"
                    onClick={clearQuery}
                    aria-label="Clear search"
                    className="absolute right-0 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-8 h-8 text-ink-muted hover:text-copper"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
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
            </form>

            <div className="mt-10">
              {hasQuery ? (
                <Results
                  status={status}
                  items={items}
                  query={query.trim()}
                  suggestions={suggestions}
                  onNavigate={close}
                />
              ) : (
                <Resting suggestions={suggestions} onNavigate={close} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Results({
  status,
  items,
  query,
  suggestions,
  onNavigate,
}: {
  status: Status
  items: ProductSearchResult[]
  query: string
  suggestions: ProductSearchResult[]
  onNavigate: () => void
}) {
  if (status === 'loading' && items.length === 0) {
    return <p className="text-sm text-ink-muted">Searching…</p>
  }
  if (status === 'done' && items.length === 0) {
    return (
      <div className="space-y-10">
        <p className="text-ink-muted leading-relaxed">
          Nothing matched{' '}
          <span className="font-display text-dark italic">“{query}”</span>. It may be sold out
          or named differently - here are a few pieces you might like instead.
        </p>
        {suggestions.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ink-muted mb-3">
              You might like
            </p>
            <ul className="divide-y divide-warm-mid">
              {suggestions.map((p) => (
                <li key={p.id}>
                  <ResultRow product={p} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }
  return (
    <div>
      <ul className="divide-y divide-warm-mid">
        {items.map((p) => (
          <li key={p.id}>
            <ResultRow product={p} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
      <Link
        href={`/products?q=${encodeURIComponent(query)}`}
        onClick={onNavigate}
        className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-copper hover:text-dark transition-colors"
      >
        View all results
      </Link>
    </div>
  )
}

function Resting({
  suggestions,
  onNavigate,
}: {
  suggestions: ProductSearchResult[]
  onNavigate: () => void
}) {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-ink-muted mb-3">Browse</p>
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              onClick={onNavigate}
              className="px-4 py-2 border border-warm-mid text-sm hover:border-dark hover:text-copper transition-colors"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      {suggestions.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink-muted mb-3">
            Popular right now
          </p>
          <ul className="divide-y divide-warm-mid">
            {suggestions.map((p) => (
              <li key={p.id}>
                <ResultRow product={p} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function ResultRow({
  product,
  onNavigate,
}: {
  product: ProductSearchResult
  onNavigate: () => void
}) {
  const onSale =
    typeof product.compareAtPrice === 'number' && product.compareAtPrice > product.price

  return (
    <Link
      href={`/products/${product.slug}`}
      onClick={onNavigate}
      className="group flex items-center gap-4 py-3"
    >
      <div className="relative w-14 h-14 flex-shrink-0 bg-warm-mid rounded-sm overflow-hidden">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="56px"
            className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 motion-reduce:transition-none"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-[10px] text-ink-muted">
            —
          </span>
        )}
      </div>
      <span className="flex-1 min-w-0 font-display text-lg text-dark group-hover:text-copper transition-colors truncate">
        {product.title}
      </span>
      <span className="text-sm whitespace-nowrap">
        {onSale && (
          <span className="line-through text-ink-muted mr-2">
            {formatPrice(product.compareAtPrice!)}
          </span>
        )}
        <span className="text-ink">{formatPrice(product.price)}</span>
      </span>
    </Link>
  )
}
