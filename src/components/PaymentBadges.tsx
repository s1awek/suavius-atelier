type Props = {
  variant?: 'footer' | 'pdp'
  className?: string
}

export function PaymentBadges({ variant = 'footer', className = '' }: Props) {
  const isPdp = variant === 'pdp'
  return (
    <div
      className={`flex flex-col ${isPdp ? 'items-start gap-2' : 'items-start gap-3'} ${className}`}
      aria-label="Accepted payment methods"
    >
      <div className="flex items-center gap-2">
        <CardBadge label="Visa">
          <svg viewBox="0 0 48 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <text
              x="24"
              y="13"
              textAnchor="middle"
              fontFamily="Helvetica, Arial, sans-serif"
              fontWeight="900"
              fontSize="13"
              fontStyle="italic"
              fill="#1A1F71"
              letterSpacing="0.5"
            >
              VISA
            </text>
          </svg>
        </CardBadge>
        <CardBadge label="Mastercard">
          <svg viewBox="0 0 48 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="20" cy="14" r="9" fill="#EB001B" />
            <circle cx="28" cy="14" r="9" fill="#F79E1B" fillOpacity="0.9" />
            <path
              d="M24 7.5a9 9 0 0 1 0 13 9 9 0 0 1 0-13Z"
              fill="#FF5F00"
            />
          </svg>
        </CardBadge>
        <CardBadge label="American Express">
          <svg viewBox="0 0 48 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="48" height="16" fill="#2E77BC" rx="2" />
            <text
              x="24"
              y="11"
              textAnchor="middle"
              fontFamily="Helvetica, Arial, sans-serif"
              fontWeight="700"
              fontSize="6.5"
              fill="#fff"
              letterSpacing="0.3"
            >
              AMERICAN
            </text>
            <text
              x="24"
              y="14.5"
              textAnchor="middle"
              fontFamily="Helvetica, Arial, sans-serif"
              fontWeight="700"
              fontSize="3.5"
              fill="#fff"
              letterSpacing="1.5"
            >
              EXPRESS
            </text>
          </svg>
        </CardBadge>
      </div>
      <p className="text-xs text-ink-muted">
        Secure checkout powered by{' '}
        <a
          href="https://stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:text-copper"
        >
          Stripe
        </a>
      </p>
    </div>
  )
}

function CardBadge({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <span
      title={label}
      className="inline-flex items-center justify-center w-12 h-7 bg-white border border-warm-mid rounded-sm overflow-hidden"
      role="img"
      aria-label={label}
    >
      {children}
    </span>
  )
}
