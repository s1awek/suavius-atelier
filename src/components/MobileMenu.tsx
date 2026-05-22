'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type Props = {
  storeName: string
  email?: string
}

export function MobileMenu({ storeName, email }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="md:hidden inline-flex items-center justify-center w-10 h-10 -mr-2 cursor-pointer hover:text-copper transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <line x1="3" y1="7" x2="21" y2="7" />
          <line x1="3" y1="13" x2="21" y2="13" />
          <line x1="3" y1="19" x2="13" y2="19" />
        </svg>
      </button>

      <div
        className={`md:hidden fixed inset-0 z-[60] bg-warm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={`${storeName} navigation`}
      >
        <div className="flex flex-col h-full">
          <header className="flex items-center justify-between px-6 py-6 border-b border-warm-mid">
            <span className="text-xs uppercase tracking-[0.25em] text-ink-muted">Menu</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="inline-flex items-center justify-center w-10 h-10 -mr-2 cursor-pointer hover:text-copper transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </svg>
            </button>
          </header>

          <nav className="flex-1 overflow-y-auto">
            <ul className="min-h-full flex flex-col justify-center space-y-7 text-center px-8 py-8">
              <NavItem href="/products" label="Shop" />
              <NavItem href="/about" label="About" />
              <NavItem href="/contact" label="Contact" />
              <NavItem href="/shipping-returns" label="Shipping & returns" small />
              <NavItem href="/faq" label="FAQ" small />
            </ul>
          </nav>

          <footer className="px-8 pb-10 pt-6 border-t border-warm-mid text-center space-y-2">
            {email && (
              <a
                href={`mailto:${email}`}
                className="block text-sm text-ink-muted hover:text-copper transition-colors"
              >
                {email}
              </a>
            )}
            <p className="text-xs uppercase tracking-[0.25em] text-ink-muted">
              Bielawa, Poland
            </p>
          </footer>
        </div>
      </div>
    </>
  )
}

function NavItem({
  href,
  label,
  small = false,
}: {
  href: string
  label: string
  small?: boolean
}) {
  return (
    <li>
      <Link
        href={href}
        className={
          small
            ? 'text-sm uppercase tracking-[0.2em] text-ink-muted hover:text-copper transition-colors'
            : 'font-display text-4xl text-dark hover:text-copper transition-colors'
        }
      >
        {label}
      </Link>
    </li>
  )
}
