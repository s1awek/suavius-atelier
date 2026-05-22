'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useCart, cartTotal } from '@/lib/cart'
import { formatPrice } from '@/lib/format'
import { track } from '@vercel/analytics'

export function CartDrawer() {
  const items = useCart((s) => s.items)
  const isOpen = useCart((s) => s.isOpen)
  const close = useCart((s) => s.close)
  const remove = useCart((s) => s.remove)
  const updateQuantity = useCart((s) => s.updateQuantity)

  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  const total = cartTotal(items)

  async function handleCheckout() {
    setError(null)
    setIsCheckingOut(true)
    track('begin_checkout', {
      itemCount: items.reduce((n, i) => n + i.quantity, 0),
      value: total / 100,
      currency: items[0]?.snapshot.currency ?? 'EUR',
    })
    try {
      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            variantSku: i.variantSku,
            quantity: i.quantity,
          })),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Checkout failed')
      }
      const { url } = await res.json()
      if (!url) throw new Error('No checkout URL returned')
      window.location.href = url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed')
      setIsCheckingOut(false)
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-dark/40 z-40 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={close}
        aria-hidden="true"
      />
      <aside
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-warm z-50 shadow-xl transform transition-transform flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Shopping cart"
      >
        <header className="flex items-center justify-between px-6 py-5 border-b border-warm-mid">
          <h2 className="font-display text-2xl">Cart</h2>
          <button
            type="button"
            onClick={close}
            className="text-ink-muted hover:text-dark cursor-pointer"
            aria-label="Close cart"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <p className="text-ink-muted text-sm py-8 text-center">Your cart is empty.</p>
          ) : (
            <ul className="space-y-6">
              {items.map((item) => {
                const atLimit = item.quantity >= item.snapshot.stock
                return (
                  <li key={`${item.productId}::${item.variantSku}`} className="flex gap-4">
                    <div className="w-20 h-20 bg-warm-mid relative flex-shrink-0">
                      {item.snapshot.imageUrl && (
                        <Image
                          src={item.snapshot.imageUrl}
                          alt={item.snapshot.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.snapshot.title}</p>
                      {item.snapshot.variantName && item.snapshot.variantName !== 'Standard' && (
                        <p className="text-xs text-ink-muted mt-0.5">{item.snapshot.variantName}</p>
                      )}
                      <p className="text-sm text-ink-muted mt-1">
                        {formatPrice(item.snapshot.price, item.snapshot.currency)}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.productId, item.variantSku, item.quantity - 1)
                          }
                          className="w-6 h-6 border border-warm-mid hover:bg-warm-mid cursor-pointer text-sm"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="text-sm w-6 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.productId, item.variantSku, item.quantity + 1)
                          }
                          disabled={atLimit}
                          className="w-6 h-6 border border-warm-mid hover:bg-warm-mid cursor-pointer text-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(item.productId, item.variantSku)}
                          className="ml-auto text-xs text-ink-muted hover:text-copper cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                      {atLimit && (
                        <p className="text-xs text-ink-muted mt-2">
                          You have all available units. Need more?{' '}
                          <a
                            href="mailto:orders@suaviusatelier.com"
                            className="underline hover:text-copper"
                          >
                            Email us
                          </a>
                          .
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-warm-mid px-6 py-5 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">Subtotal</span>
              <span>{formatPrice(total, items[0]?.snapshot.currency)}</span>
            </div>
            <p className="text-xs text-ink-muted">Shipping and taxes calculated at checkout.</p>
            {error && <p className="text-xs text-red-700">{error}</p>}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full px-6 py-4 bg-dark text-warm hover:bg-copper transition-colors text-sm tracking-wide cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCheckingOut ? 'Redirecting…' : 'Checkout'}
            </button>
          </footer>
        )}
      </aside>
    </>
  )
}
