'use client'

import { useSearchUI } from '@/lib/search-ui'

/**
 * Search trigger (magnifier). Like CartButton it can be rendered in multiple
 * places (desktop nav, mobile bar); all instances open the one shared overlay.
 */
export function SearchButton({ className = '' }: { className?: string }) {
  const open = useSearchUI((s) => s.open)

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Search"
      className={`inline-flex items-center justify-center hover:text-copper transition-colors cursor-pointer p-1 -m-1 ${className}`}
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
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    </button>
  )
}
