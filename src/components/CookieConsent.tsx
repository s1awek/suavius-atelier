'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'cookie-consent'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY)
      if (!v) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'essential')
    } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-40 bg-warm border border-warm-mid shadow-lg p-5"
    >
      <p className="text-sm leading-relaxed text-ink">
        This site uses essential cookies for the shopping cart and checkout, plus privacy-friendly,
        cookieless analytics (no personal data, no cross-site tracking) to measure traffic.{' '}
        <Link href="/cookies" className="underline hover:text-copper">
          Learn more
        </Link>
        .
      </p>
      <button
        type="button"
        onClick={accept}
        className="mt-4 px-5 py-2 bg-dark text-warm text-sm tracking-wide hover:bg-copper transition-colors cursor-pointer"
      >
        Got it
      </button>
    </div>
  )
}
