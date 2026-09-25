import React from 'react'
import { Hanken_Grotesk, Martian_Mono } from 'next/font/google'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { CartDrawer } from '@/components/CartDrawer'
import { SearchOverlay } from '@/components/SearchOverlay'
import { CookieConsent } from '@/components/CookieConsent'
import { TestModeBanner } from '@/components/TestModeBanner'
import { DraftPreviewBanner } from '@/components/DraftPreviewBanner'
import { AnalyticsGate } from '@/components/AnalyticsGate'
import './styles.css'

const hanken = Hanken_Grotesk({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-hanken',
  style: ['normal', 'italic'],
  display: 'swap',
})

const martian = Martian_Mono({
  subsets: ['latin'],
  variable: '--font-martian',
  display: 'swap',
})

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://suaviusatelier.com'

const SITE_TITLE = 'Suavius Atelier - Circuit Board Coasters and Solid Ash Wood'
const SITE_DESCRIPTION =
  'Coasters made from real circuit boards: 1.6 mm FR4 with a plated gold rim and a printed picture, plus one in solid ash. Designed in Bielawa, Poland.'

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s · Suavius Atelier',
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: [
      { url: '/brand/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/mark-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/brand/mark.svg', type: 'image/svg+xml' },
    ],
    apple: '/brand/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Suavius Atelier',
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  // Pinterest domain claim - unlocks product Rich Pins + analytics/ads attribution for the domain.
  verification: {
    other: { 'p:domain_verify': '50baf6f13edd79e4d3b751b701e45569' },
  },
}

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Suavius Atelier',
  url: SITE_URL,
  logo: `${SITE_URL}/brand/mark-512.png`,
  description:
    'Circuit board coasters with a plated gold rim, and a solid ash wood coaster. Designed in Bielawa, Poland.',
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${hanken.variable} ${martian.variable}`}>
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <DraftPreviewBanner />
        <TestModeBanner />
        <Header />
        <main className="flex-1">{props.children}</main>
        <Footer />
        <CartDrawer />
        <SearchOverlay />
        <CookieConsent />
        <AnalyticsGate />
      </body>
    </html>
  )
}
