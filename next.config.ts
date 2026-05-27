import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const r2PublicHost = (() => {
  try {
    return process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL).hostname : undefined
  } catch {
    return undefined
  }
})()

// Static CSP (no per-request nonce). A nonce + 'strict-dynamic' policy is incompatible
// with statically/ISR-rendered pages: the cached HTML carries no nonce while the
// response header demands one, so Next's bootstrap scripts are blocked and the page
// never hydrates. We keep pages static and allow inline scripts via 'unsafe-inline';
// the site renders no untrusted HTML, so the XSS exposure from that is low.
const csp = (() => {
  const isDev = process.env.NODE_ENV === 'development'
  const imgSrc = ["'self'", 'data:', 'blob:']
  if (r2PublicHost) imgSrc.push(`https://${r2PublicHost}`)

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      'https://js.stripe.com',
      'https://m.stripe.network',
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': imgSrc,
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", 'https://api.stripe.com', 'https://m.stripe.network', 'https://r.stripe.com'],
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
})()

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
      {
        pathname: '/brand/**',
      },
    ],
    remotePatterns: r2PublicHost
      ? [
          {
            protocol: 'https',
            hostname: r2PublicHost,
            pathname: '/**',
          },
        ]
      : [],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
  async headers() {
    const staticSecurity = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
      },
    ]
    return [
      {
        source: '/:path*',
        headers: staticSecurity,
      },
      {
        // CSP only on front-end routes; Payload admin (/admin) and API run without it,
        // matching the previous middleware matcher.
        source: '/((?!admin|api).*)',
        headers: [{ key: 'Content-Security-Policy', value: csp }],
      },
    ]
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
