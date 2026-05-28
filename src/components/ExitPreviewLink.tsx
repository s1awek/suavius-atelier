'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function ExitPreviewLink() {
  const pathname = usePathname()
  const href = `/next/exit-preview?path=${encodeURIComponent(pathname || '/')}`
  return (
    <Link
      href={href}
      className="underline underline-offset-2 hover:text-white transition-colors"
    >
      Exit preview
    </Link>
  )
}
