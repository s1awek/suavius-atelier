import Link from 'next/link'

export type Crumb = {
  label: string
  href?: string
}

type Props = {
  items: Crumb[]
  className?: string
}

export function Breadcrumbs({ items, className = '' }: Props) {
  if (items.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={`text-xs uppercase tracking-[0.2em] text-ink-muted ${className}`}
    >
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-copper transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className="text-ink">
                  {item.label}
                </span>
              )}
              {!isLast && <span aria-hidden="true" className="text-ink-muted/60">/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
