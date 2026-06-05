import Link from 'next/link'
import Image from 'next/image'
import { getPayloadClient } from '@/lib/payload'
import { PaymentBadges } from './PaymentBadges'
import { NewsletterForm } from './NewsletterForm'
import { AnalyticsOptOut } from './AnalyticsOptOut'

export async function Footer() {
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'settings' })

  const year = new Date().getFullYear()
  const storeName = settings.storeName ?? 'Suavius Atelier'

  return (
    <footer className="border-t border-warm-mid bg-warm-mid/30 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-14 border-b border-warm-mid grid gap-8 md:grid-cols-[1.4fr_1fr] items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-copper mb-3">
            Atelier journal
          </p>
          <h3 className="font-display text-2xl md:text-3xl text-dark leading-tight">
            First news of new pieces, in your inbox.
          </h3>
          <p className="mt-3 text-sm text-ink-muted max-w-md">
            Quiet letters when a small batch is ready. No more than once a month. Unsubscribe with one click.
          </p>
        </div>
        <NewsletterForm />
      </div>
      <div className="max-w-7xl mx-auto px-6 py-12 grid gap-8 md:grid-cols-4">
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
              <Link href="/collections" className="hover:text-copper">
                Collections
              </Link>
            </li>
            <li>
              <Link href="/bespoke" className="hover:text-copper">
                Bespoke orders
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
              <Link href="/materials" className="hover:text-copper">
                Materials & process
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

        <div>
          <h4 className="text-sm font-medium uppercase tracking-wider text-ink-muted mb-3">
            Legal
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/terms" className="hover:text-copper">
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-copper">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/cookies" className="hover:text-copper">
                Cookie Policy
              </Link>
            </li>
            <li>
              <AnalyticsOptOut />
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-warm-mid">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-xs text-ink-muted">
            © {year} {storeName}. All rights reserved.
          </p>
          <PaymentBadges variant="footer" />
        </div>
      </div>
    </footer>
  )
}
