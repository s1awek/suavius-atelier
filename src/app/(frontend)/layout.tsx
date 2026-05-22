import React from 'react'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { CartDrawer } from '@/components/CartDrawer'
import { TestModeBanner } from '@/components/TestModeBanner'
import './styles.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-cormorant',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://suaviusatelier.com'

const SITE_TITLE = 'Suavius Atelier - Handcrafted PCB Coasters & Engraved Wood'
const SITE_DESCRIPTION =
  'A small atelier crafting hand-designed PCB coasters and laser-engraved wood accessories. Unique handmade pieces blending circuit-board aesthetics with natural materials.'

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s · Suavius Atelier',
  },
  description: SITE_DESCRIPTION,
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
}

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Suavius Atelier',
  url: SITE_URL,
  description:
    'Hand-designed PCB coasters and laser-engraved wood accessories from a small atelier.',
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <TestModeBanner />
        <Header />
        <main className="flex-1">{props.children}</main>
        <Footer />
        <CartDrawer />
      </body>
    </html>
  )
}
