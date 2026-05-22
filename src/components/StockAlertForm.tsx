'use client'

import { useState } from 'react'

type Status = 'idle' | 'sending' | 'sent' | 'error'

type Props = {
  productId: number
  variantSku: string
  variantName: string
}

export function StockAlertForm({ productId, variantSku, variantName }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setError(null)
    setStatus('sending')

    const formData = new FormData(form)
    const payload = {
      productId,
      variantSku,
      email: formData.get('email'),
      website: formData.get('website'),
    }

    try {
      const res = await fetch('/api/stock-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  if (status === 'sent') {
    return (
      <p className="text-xs text-ink-muted mt-3 leading-relaxed">
        Thank you. We will email you when{' '}
        {variantName !== 'Standard' ? <em>{variantName}</em> : 'this piece'} is back in stock.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2" noValidate>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <p className="text-xs text-ink-muted leading-relaxed">
        Notify me when{' '}
        {variantName !== 'Standard' ? <em>{variantName}</em> : 'this piece'} is back in stock:
      </p>
      <div className="flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="your@email.com"
          aria-label="Email for stock notification"
          className="flex-1 min-w-0 px-3 py-2 bg-warm border border-warm-mid focus:border-dark focus:outline-none text-sm"
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className="px-4 py-2 bg-dark text-warm hover:bg-copper transition-colors text-xs tracking-wide uppercase cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {status === 'sending' ? '…' : 'Notify me'}
        </button>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </form>
  )
}
