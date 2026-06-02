'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Status = 'idle' | 'sending' | 'sent' | 'error'

type Props = {
  productId: number
  variantSku: string
  variantName: string
  // `out-of-stock`: nothing left in the store. `at-limit`: stock exists but the customer
  // already holds all of it in their cart. Tweaks the copy; the signup flow is identical.
  reason?: 'out-of-stock' | 'at-limit'
}

/**
 * Waitlist CTA: a full-width "Join the waitlist" button that opens a modal where the customer
 * leaves their email and accepts the Privacy Policy. On submit it posts to `/api/stock-alerts`;
 * the restock hook emails them once when the variant's stock next increases.
 */
export function StockAlertDialog({ productId, variantSku, variantName, reason = 'out-of-stock' }: Props) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pieceLabel = variantName && variantName !== 'Standard' ? variantName : 'this piece'
  const atLimit = reason === 'at-limit'
  const triggerNote = atLimit
    ? `You have all available units in your cart. Join the waitlist and we will email you when more of ${pieceLabel} are made.`
    : `Out of stock. Leave your email and we will let you know the moment ${pieceLabel} is back.`
  const modalIntro = atLimit
    ? `You already hold every available unit. We will send you a single email when more of ${pieceLabel} are available.`
    : `We will send you a single email when ${pieceLabel} is back in stock. No marketing, no spam.`

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setError(null)
    setStatus('sending')

    const formData = new FormData(form)
    try {
      const res = await fetch('/api/stock-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          variantSku,
          email: formData.get('email'),
          website: formData.get('website'),
          consent,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Subscription failed')
      }
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Subscription failed')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-10 w-full px-6 py-4 bg-dark text-warm hover:bg-copper transition-colors text-sm tracking-wide cursor-pointer"
      >
        Join the waitlist
      </button>
      <p className="text-xs text-ink-muted mt-3 leading-relaxed">{triggerNote}</p>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-dark/40 z-50 transition-opacity"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Back-in-stock waitlist"
          >
            <div className="bg-warm w-full max-w-md shadow-xl relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-4 right-5 text-ink-muted hover:text-dark cursor-pointer text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>

              <div className="px-6 py-7">
                {status === 'sent' ? (
                  <div className="text-center py-4">
                    <h3 className="font-display text-2xl mb-3">You are on the list</h3>
                    <p className="text-sm text-ink-muted leading-relaxed">
                      We will email you as soon as {pieceLabel} is back in stock.
                    </p>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="mt-6 px-6 py-3 bg-dark text-warm hover:bg-copper transition-colors text-sm tracking-wide cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="font-display text-2xl mb-2">Join the waitlist</h3>
                    <p className="text-sm text-ink-muted leading-relaxed mb-5">{modalIntro}</p>
                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                      <input
                        type="text"
                        name="website"
                        tabIndex={-1}
                        autoComplete="off"
                        className="hidden"
                        aria-hidden="true"
                      />
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="your@email.com"
                        aria-label="Email for back-in-stock notification"
                        className="w-full px-3 py-2.5 bg-warm border border-warm-mid focus:border-dark focus:outline-none text-sm"
                      />
                      <label className="flex items-start gap-2 text-xs text-ink-muted leading-relaxed cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={consent}
                          onChange={(e) => setConsent(e.target.checked)}
                          required
                          className="mt-0.5 accent-copper cursor-pointer flex-shrink-0"
                          aria-required="true"
                        />
                        <span>
                          I agree that Suavius Atelier may store my email to send a single
                          back-in-stock notification. See our{' '}
                          <Link href="/privacy" className="underline hover:text-copper" target="_blank">
                            Privacy Policy
                          </Link>
                          .
                        </span>
                      </label>
                      {error && <p className="text-xs text-red-700">{error}</p>}
                      <button
                        type="submit"
                        disabled={status === 'sending' || !consent}
                        className="w-full px-6 py-3.5 bg-dark text-warm hover:bg-copper transition-colors text-sm tracking-wide cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-dark"
                      >
                        {status === 'sending' ? 'Adding you…' : 'Notify me when available'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
