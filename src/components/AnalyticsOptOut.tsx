'use client'

import { useEffect, useState } from 'react'
import {
  ANALYTICS_CONSENT_EVENT,
  isAnalyticsDisabled,
  isGpcActive,
  setAnalyticsOptOut,
} from '@/lib/analytics-consent'

/**
 * Footer control letting visitors object to analytics (GDPR Art. 21). When the browser
 * sends a Global Privacy Control signal, analytics is forced off and the control is
 * shown as locked, since we honour that signal automatically.
 */
export function AnalyticsOptOut() {
  const [disabled, setDisabled] = useState(false)
  const [gpc, setGpc] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const sync = () => {
      setDisabled(isAnalyticsDisabled())
      setGpc(isGpcActive())
    }
    sync()
    setReady(true)
    window.addEventListener(ANALYTICS_CONSENT_EVENT, sync)
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, sync)
  }, [])

  // Until the client check runs, mirror the SSR default (analytics on) to avoid a flash.
  if (ready && gpc) {
    return (
      <span className="text-ink-muted/70" title="Disabled by your browser's privacy signal">
        Analytics off
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setAnalyticsOptOut(!disabled)}
      className="hover:text-copper text-left cursor-pointer"
    >
      {ready && disabled ? 'Enable analytics' : 'Disable analytics'}
    </button>
  )
}
