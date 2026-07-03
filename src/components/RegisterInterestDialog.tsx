'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Status = 'idle' | 'sending' | 'sent' | 'error'

type Props = {
  productId: number
  /** Topic key recorded against the lead (matches the ProductInterest `topic` options). */
  topic?: string
  /** Headline shown above the button, e.g. "Gold-foil personalisation". */
  title: string
  /** One-line explanation shown under the headline. */
  blurb: string
}

/**
 * One-step demand capture for an upcoming option. A button opens a modal where the visitor
 * leaves their email and accepts the Privacy Policy; on submit it posts to `/api/product-interest`.
 * Unlike the personalization-in-cart flow, this requires no purchase — it just records the lead.
 */
export function RegisterInterestDialog({ productId, topic = 'gold-foil-personalization', title, blurb }: Props) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      const res = await fetch('/api/product-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          topic,
          email: formData.get('email'),
          website: formData.get('website'),
          consent,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Could not register interest')
      }
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Could not register interest')
    }
  }

  return (
    <div className="mt-8 border-t border-warm-mid pt-6">
      <p className="text-xs uppercase tracking-[0.2em] text-copper mb-2">{title}</p>
      <p className="text-sm text-ink-muted leading-relaxed mb-4">{blurb}</p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-6 py-3 border border-dark text-dark hover:bg-dark hover:text-warm transition-colors text-sm tracking-wide cursor-pointer"
      >
        I&apos;m interested in personalisation
      </button>

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
            aria-label={`I'm interested in ${title}`}
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
                    <h3 className="font-display text-2xl text-dark mb-3">Noted, thank you</h3>
                    <p className="text-sm text-ink-muted leading-relaxed">
                      We will email you once {title.toLowerCase()} is available. No marketing in the
                      meantime.
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
                    <h3 className="font-display text-2xl text-dark mb-2">{title}</h3>
                    <p className="text-sm text-ink-muted leading-relaxed mb-5">
                      Leave your email and we will let you know the moment it is ready. A single
                      message, not marketing.
                    </p>
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
                        aria-label="Email for interest notification"
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
                          notification when this option is available. See our{' '}
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
                        {status === 'sending' ? 'Registering…' : 'Notify me when available'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
