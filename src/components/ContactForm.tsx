'use client'

import { useState } from 'react'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setStatus('sending')

    const formData = new FormData(e.currentTarget)
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
      website: formData.get('website'),
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Sending failed')
      }
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Sending failed')
    }
  }

  if (status === 'sent') {
    return (
      <div className="border border-warm-mid p-8 bg-warm">
        <h3 className="font-display text-2xl mb-3">Thank you</h3>
        <p className="text-sm text-ink-muted leading-relaxed">
          Your message has been received. We typically respond within 1-2 business days.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div>
        <label htmlFor="contact-name" className="block text-xs uppercase tracking-wider text-ink-muted mb-2">
          Name
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          maxLength={120}
          autoComplete="name"
          className="w-full px-4 py-3 bg-warm border border-warm-mid focus:border-dark focus:outline-none text-sm"
        />
      </div>

      <div>
        <label htmlFor="contact-email" className="block text-xs uppercase tracking-wider text-ink-muted mb-2">
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full px-4 py-3 bg-warm border border-warm-mid focus:border-dark focus:outline-none text-sm"
        />
      </div>

      <div>
        <label htmlFor="contact-subject" className="block text-xs uppercase tracking-wider text-ink-muted mb-2">
          Subject <span className="text-ink-muted/60 normal-case tracking-normal">(optional)</span>
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          maxLength={200}
          className="w-full px-4 py-3 bg-warm border border-warm-mid focus:border-dark focus:outline-none text-sm"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-xs uppercase tracking-wider text-ink-muted mb-2">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          maxLength={4000}
          rows={6}
          className="w-full px-4 py-3 bg-warm border border-warm-mid focus:border-dark focus:outline-none text-sm resize-y"
        />
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="px-8 py-3 bg-dark text-warm hover:bg-copper transition-colors text-sm tracking-wide cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
