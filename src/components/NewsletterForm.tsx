'use client'

import { useState } from 'react'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export function NewsletterForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setError(null)
    setStatus('sending')

    const formData = new FormData(form)
    const payload = {
      email: formData.get('email'),
      website: formData.get('website'),
    }

    try {
      const res = await fetch('/api/newsletter', {
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
      <p className="text-sm text-ink-muted">
        Thank you. We will be in touch when something new is ready.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <div className="flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="your@email.com"
          aria-label="Email for newsletter"
          className="flex-1 min-w-0 px-3 py-2.5 bg-warm border border-warm-mid focus:border-dark focus:outline-none text-sm"
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className="px-4 py-2.5 bg-dark text-warm hover:bg-copper transition-colors text-xs tracking-wide uppercase cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {status === 'sending' ? '…' : 'Subscribe'}
        </button>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </form>
  )
}
