'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[frontend error]', error)
  }, [error])

  return (
    <div className="max-w-2xl mx-auto px-6 py-32 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-copper mb-6">Something went wrong</p>
      <h1 className="font-display text-5xl md:text-6xl mb-6">A small misfire.</h1>
      <p className="text-ink-muted leading-relaxed mb-10">
        We hit an unexpected error. Try again, and if it persists, write to{' '}
        <a href="mailto:orders@suaviusatelier.com" className="underline hover:text-copper">
          orders@suaviusatelier.com
        </a>
        .
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={reset}
          className="px-6 py-3 bg-dark text-warm text-sm tracking-wide hover:bg-copper transition-colors cursor-pointer"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-6 py-3 border border-warm-mid text-sm tracking-wide hover:border-dark transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
