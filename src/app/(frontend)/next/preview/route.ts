import { draftMode, headers as nextHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'

/**
 * Enables Next draft mode and redirects to the requested public path, so the panel's
 * "Preview" button shows the latest draft on the real frontend. Gated by the Payload
 * session cookie (same-origin from the admin), so only logged-in editors can turn it on.
 */
export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')

  // Only allow internal, single-leading-slash paths (no protocol-relative // or absolute URLs).
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return new Response('Invalid preview path', { status: 400 })
  }

  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await nextHeaders() })
  if (!user) {
    return new Response('You must be logged in to preview drafts.', { status: 403 })
  }

  const dm = await draftMode()
  dm.enable()
  redirect(path)
}
