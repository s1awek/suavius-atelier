import { NextResponse, type NextRequest } from 'next/server'

function buildCsp(nonce: string, r2Host: string | undefined): string {
  const imgHosts = ["'self'", 'data:', 'blob:']
  if (r2Host) imgHosts.push(`https://${r2Host}`)

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      'https://js.stripe.com',
      'https://m.stripe.network',
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': imgHosts,
    'font-src': ["'self'", 'data:'],
    'connect-src': [
      "'self'",
      'https://api.stripe.com',
      'https://m.stripe.network',
      'https://r.stripe.com',
    ],
    'frame-src': ['https://js.stripe.com', 'https://hooks.stripe.com'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'", 'https://checkout.stripe.com'],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
  }

  return Object.entries(directives)
    .map(([k, v]) => (v.length ? `${k} ${v.join(' ')}` : k))
    .join('; ')
}

export function middleware(request: NextRequest): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  let r2Host: string | undefined
  try {
    r2Host = process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL).hostname : undefined
  } catch {
    r2Host = undefined
  }
  const csp = buildCsp(nonce, r2Host)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('content-security-policy', csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('content-security-policy', csp)
  return response
}

export const config = {
  matcher: [
    {
      source: '/((?!admin|api|_next/static|_next/image|favicon|brand|robots\\.txt|sitemap\\.xml).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
