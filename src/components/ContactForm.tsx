'use client'

import { useState } from 'react'

type Status = 'idle' | 'sending' | 'sent' | 'error'

type ContactFormProps = {
  /** When set, the subject is submitted as this fixed value and the visible subject input is hidden. */
  fixedSubject?: string
  /** Prefills the (still-editable) optional subject input. Ignored when `fixedSubject` is set. */
  defaultSubject?: string
  submitLabel?: string
  successTitle?: string
  successBody?: string
  messageLabel?: string
  /** Optional helper line under the message label, e.g. what to include. */
  messageHint?: string
}

export function ContactForm({
  fixedSubject,
  defaultSubject,
  submitLabel = 'Send message',
  successTitle = 'Thank you',
  successBody = 'Your message has been received. We typically respond within 1-2 business days.',
  messageLabel = 'Message',
  messageHint,
}: ContactFormProps) {
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
        <h3 className="font-display text-2xl text-dark mb-3">{successTitle}</h3>
        <p className="text-sm text-ink-muted leading-relaxed">{successBody}</p>
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

      {fixedSubject ? (
        <input type="hidden" name="subject" value={fixedSubject} />
      ) : (
        <div>
          <label htmlFor="contact-subject" className="block text-xs uppercase tracking-wider text-ink-muted mb-2">
            Subject <span className="text-ink-muted/60 normal-case tracking-normal">(optional)</span>
          </label>
          <input
            id="contact-subject"
            name="subject"
            type="text"
            maxLength={200}
            defaultValue={defaultSubject}
            className="w-full px-4 py-3 bg-warm border border-warm-mid focus:border-dark focus:outline-none text-sm"
          />
        </div>
      )}

      <div>
        <label htmlFor="contact-message" className="block text-xs uppercase tracking-wider text-ink-muted mb-2">
          {messageLabel}
        </label>
        {messageHint && (
          <p id="contact-message-hint" className="text-xs text-ink-muted leading-relaxed mb-2 -mt-0.5">
            {messageHint}
          </p>
        )}
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          maxLength={4000}
          rows={6}
          aria-describedby={messageHint ? 'contact-message-hint' : undefined}
          className="w-full px-4 py-3 bg-warm border border-warm-mid focus:border-dark focus:outline-none text-sm resize-y"
        />
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="px-8 py-3 bg-dark text-warm hover:bg-copper transition-colors text-sm tracking-wide cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'sending' ? 'Sending…' : submitLabel}
      </button>
    </form>
  )
}
