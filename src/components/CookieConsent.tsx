'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'cookie-consent'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // localStorage is client-only, so the consent banner's visibility can only be
    // resolved after mount (it must stay hidden during SSR to avoid a hydration flash).
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const v = localStorage.getItem(STORAGE_KEY)
      if (!v) setVisible(true)
    } catch {
      setVisible(true)
    }
    /* eslint-enable react-hooks/set-state-in-effect */
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
      className="fixed bottom-0 inset-x-0 md:inset-x-auto md:right-6 md:bottom-6 md:max-w-md z-40 bg-warm border-t md:border border-warm-mid shadow-lg px-4 py-3 md:p-5 flex items-center gap-4 md:block"
    >
      <p className="text-sm leading-snug md:leading-relaxed text-ink">
        Essential cookies for the cart and checkout, plus cookieless analytics with no personal
        data.{' '}
        <Link href="/cookies" className="underline hover:text-copper">
          Learn more
        </Link>
      </p>
      <button
        type="button"
        onClick={accept}
        className="shrink-0 md:mt-4 min-h-11 px-5 border border-dark/30 text-sm hover:border-copper hover:text-copper transition-colors cursor-pointer"
      >
        Got it
      </button>
    </div>
  )
}
