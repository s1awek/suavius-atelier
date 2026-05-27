'use client'

/**
 * Client-side analytics opt-out. Analytics is cookieless/anonymous so it does not
 * legally require prior opt-in, but we still let visitors object (GDPR Art. 21) and
 * honour the browser's Global Privacy Control signal.
 */
export const ANALYTICS_OPT_OUT_KEY = 'analytics-opt-out'
export const ANALYTICS_CONSENT_EVENT = 'analytics-consent-change'

type NavigatorWithGpc = Navigator & { globalPrivacyControl?: boolean }

export function isGpcActive(): boolean {
  if (typeof navigator === 'undefined') return false
  return (navigator as NavigatorWithGpc).globalPrivacyControl === true
}

export function isAnalyticsDisabled(): boolean {
  if (typeof window === 'undefined') return true
  if (isGpcActive()) return true
  try {
    return localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === '1'
  } catch {
    return false
  }
}

export function setAnalyticsOptOut(optOut: boolean): void {
  try {
    if (optOut) localStorage.setItem(ANALYTICS_OPT_OUT_KEY, '1')
    else localStorage.removeItem(ANALYTICS_OPT_OUT_KEY)
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ANALYTICS_CONSENT_EVENT))
  }
}
