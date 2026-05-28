import { NextResponse, type NextRequest } from 'next/server'
import { get } from '@vercel/edge-config'
import type { RedirectEntry, RedirectMap } from '@/lib/edge-config-redirects'
import { EDGE_CONFIG_REDIRECTS_KEY } from '@/lib/edge-config-redirects'

/**
 * Hard 301/308 redirects resolved at the edge from Vercel Edge Config. The redirect map
 * is kept in sync by the Redirects collection hooks. If Edge Config isn't configured yet,
 * this no-ops and the in-page `applyRedirect` fallback (soft redirect) still applies.
 */
export async function middleware(req: NextRequest): Promise<NextResponse> {
  // Expose current pathname to server components (DraftPreviewBanner uses it to
  // resolve which document is being previewed).
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', req.nextUrl.pathname)
  const passThrough = NextResponse.next({ request: { headers: requestHeaders } })

  if (!process.env.EDGE_CONFIG) return passThrough

  try {
    const map = await get<RedirectMap>(EDGE_CONFIG_REDIRECTS_KEY)
    const entry: RedirectEntry | undefined = map?.[req.nextUrl.pathname]
    if (entry?.to) {
      return NextResponse.redirect(new URL(entry.to, req.url), entry.permanent === false ? 307 : 308)
    }
  } catch {
    // Edge Config unreachable — fall through to normal rendering
  }

  return passThrough
}

export const config = {
  // Run on content routes only: skip Next internals, API, the Payload admin, and any
  // path that looks like a static file (has an extension).
  matcher: ['/((?!_next/|api/|admin/|.*\\.[\\w]+$).*)'],
}
