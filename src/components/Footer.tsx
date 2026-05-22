import Link from 'next/link'
import Image from 'next/image'
import { getPayloadClient } from '@/lib/payload'

export async function Footer() {
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'settings' })

  const year = new Date().getFullYear()
  const storeName = settings.storeName ?? 'Suavius Atelier'

  return (
    <footer className="border-t border-warm-mid bg-warm-mid/30 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-12 grid gap-8 md:grid-cols-3">
        <div>
          <Image
            src="/brand/wordmark.svg"
            alt={storeName}
            width={220}
            height={28}
            className="h-6 w-auto"
          />
          <p className="text-sm text-ink-muted mt-3 max-w-xs">
            Hand-designed PCB coasters and laser-engraved wood accessories.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-medium uppercase tracking-wider text-ink-muted mb-3">
            Shop
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/products" className="hover:text-copper">
                All products
              </Link>
            </li>
            <li>
              <Link href="/shipping-returns" className="hover:text-copper">
                Shipping & returns
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-copper">
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-medium uppercase tracking-wider text-ink-muted mb-3">
            Atelier
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/about" className="hover:text-copper">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-copper">
                Contact
              </Link>
            </li>
            {(settings.socialLinks ?? []).map((s, i) => (
              <li key={i}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-copper capitalize"
                >
                  {s.platform}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-warm-mid">
        <div className="max-w-7xl mx-auto px-6 py-4 text-xs text-ink-muted">
          © {year} {storeName}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
