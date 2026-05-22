import Link from 'next/link'
import Image from 'next/image'
import { getPayloadClient } from '@/lib/payload'
import { CartButton } from './CartButton'
import { MobileMenu } from './MobileMenu'

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
        <Link href="/" aria-label={storeName} className="block min-w-0 mr-4">
          <Image
            src="/brand/wordmark.svg"
            alt={storeName}
            width={260}
            height={34}
            priority
            className="h-6 sm:h-7 md:h-8 w-auto max-w-[60vw]"
          />
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm">
          <Link href="/products" className="hover:text-copper transition-colors">
            Shop
          </Link>
          <Link href="/collections" className="hover:text-copper transition-colors">
            Collections
          </Link>
          <Link href="/materials" className="hover:text-copper transition-colors">
            Materials
          </Link>
          <Link href="/bespoke" className="hover:text-copper transition-colors">
            Bespoke
          </Link>
          <Link href="/about" className="hover:text-copper transition-colors">
            About
          </Link>
          <Link href="/contact" className="hover:text-copper transition-colors">
            Contact
          </Link>
          <CartButton />
        </nav>
        <div className="flex md:hidden items-center gap-4">
          <CartButton />
          <MobileMenu storeName={storeName} email="orders@suaviusatelier.com" />
        </div>
      </div>
    </header>
  )
}
