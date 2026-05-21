import Link from 'next/link'
import { getPayloadClient } from '@/lib/payload'

export async function Header() {
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'settings' })

  const storeName = settings.storeName ?? 'Suavius Atelier'

  return (
    <header className="border-b border-warm-mid bg-warm">
      {settings.announcementBar?.enabled && settings.announcementBar.message && (
        <div className="bg-dark text-warm text-center text-xs tracking-wide py-2 px-4">
          {settings.announcementBar.link ? (
            <Link href={settings.announcementBar.link} className="hover:text-copper-light">
              {settings.announcementBar.message}
            </Link>
          ) : (
            settings.announcementBar.message
          )}
        </div>
      )}
      <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl tracking-tight text-dark">
          {storeName}
        </Link>
        <nav className="flex items-center gap-8 text-sm">
          <Link href="/products" className="hover:text-copper transition-colors">
            Shop
          </Link>
          <Link href="/about" className="hover:text-copper transition-colors">
            About
          </Link>
          <Link href="/contact" className="hover:text-copper transition-colors">
            Contact
          </Link>
        </nav>
      </div>
    </header>
  )
}
