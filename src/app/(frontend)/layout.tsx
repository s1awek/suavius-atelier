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

export const metadata = {
  title: {
    default: 'Suavius Atelier',
    template: '%s · Suavius Atelier',
  },
  description:
    'Hand-designed PCB coasters and laser-engraved wood accessories from a small atelier.',
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <TestModeBanner />
        <Header />
        <main className="flex-1">{props.children}</main>
        <Footer />
        <CartDrawer />
      </body>
    </html>
  )
}
