import Link from 'next/link'

export type Crumb = {
  label: string
  href?: string
}

type Props = {
  items: Crumb[]
  className?: string
  /** Prepend a clickable home icon linking to the homepage. Used on standalone
   *  top-level pages; catalog pages use a text root ("Shop"/"Collections") instead. */
  home?: boolean
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 6.5 8 2l6 4.5" />
      <path d="M3.5 5.8V13a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5V5.8" />
    </svg>
  )
}

export function Breadcrumbs({ items, className = '', home = false }: Props) {
  if (items.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={`text-xs uppercase tracking-[0.2em] text-ink-muted ${className}`}
    >
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {home && (
          <li className="flex items-center gap-2">
            <Link
              href="/"
              aria-label="Home"
              className="flex items-center hover:text-copper transition-colors"
            >
              <HomeIcon />
            </Link>
            <span aria-hidden="true" className="text-ink-muted/60">/</span>
          </li>
        )}
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
