'use client'

import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { ANALYTICS_CONSENT_EVENT, isAnalyticsDisabled } from '@/lib/analytics-consent'

/**
 * Mounts Vercel Analytics + Speed Insights only when the visitor has not opted out
 * and the browser is not sending a Global Privacy Control signal. Starts disabled and
 * enables after the client check, so nothing loads before the opt-out state is known.
 */
export function AnalyticsGate() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const sync = () => setEnabled(!isAnalyticsDisabled())
    sync()
    window.addEventListener(ANALYTICS_CONSENT_EVENT, sync)
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, sync)
  }, [])

  if (!enabled) return null

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
