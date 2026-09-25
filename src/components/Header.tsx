import Link from 'next/link'
import Image from 'next/image'
import { getPayloadClient } from '@/lib/payload'
import { CartButton } from './CartButton'
import { SearchButton } from './SearchButton'
import { MobileMenu } from './MobileMenu'

export async function Header() {
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'settings' })

  const storeName = settings.storeName ?? 'Suavius Atelier'

  return (
    <header className="bg-board text-silk [&_a:hover]:text-enig [&_button:hover]:text-enig">
      {settings.announcementBar?.enabled && settings.announcementBar.message && (
        <div className="border-b border-silk/10 text-silk-muted text-center text-sm py-2 px-4">
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
            className="h-6 sm:h-7 lg:h-8 w-auto max-w-[60vw]"
          />
        </Link>
        <nav className="hidden md:flex items-center gap-4 lg:gap-7 text-sm">
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
          <SearchButton />
          <CartButton />
        </nav>
        <div className="flex md:hidden items-center gap-4">
          <SearchButton />
          <CartButton />
          <MobileMenu storeName={storeName} email="orders@suaviusatelier.com" />
        </div>
      </div>
    </header>
  )
}
