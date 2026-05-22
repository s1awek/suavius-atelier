import Link from 'next/link'

export const metadata = { title: 'Not found' }

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-32 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-copper mb-6">404</p>
      <h1 className="font-display text-5xl md:text-6xl mb-6">Lost the trail.</h1>
      <p className="text-ink-muted leading-relaxed mb-10">
        The page you were looking for is no longer here. It may have been moved or never existed.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/products"
          className="px-6 py-3 bg-dark text-warm text-sm tracking-wide hover:bg-copper transition-colors"
        >
          Browse the shop
        </Link>
        <Link
          href="/"
          className="px-6 py-3 border border-warm-mid text-sm tracking-wide hover:border-dark transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
