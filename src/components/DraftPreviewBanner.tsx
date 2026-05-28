import { draftMode, headers as nextHeaders } from 'next/headers'
import Link from 'next/link'
import { getPayloadClient } from '@/lib/payload'
import { ExitPreviewLink } from './ExitPreviewLink'

const RESERVED_TOP_LEVEL = new Set([
  'products',
  'collections',
  'categories',
  'materials',
  'bespoke',
  'contact',
  'next',
  'order-confirmation',
  'admin',
  'api',
  'robots.txt',
  'sitemap.xml',
])

type Previewable = 'products' | 'collections' | 'pages'
type DocRef = { collection: Previewable; slug: string }

function parsePath(pathname: string): DocRef | null {
  const m1 = pathname.match(/^\/products\/([^/]+)\/?$/)
  if (m1) return { collection: 'products', slug: m1[1] }
  const m2 = pathname.match(/^\/collections\/([^/]+)\/?$/)
  if (m2) return { collection: 'collections', slug: m2[1] }
  const m3 = pathname.match(/^\/([^/]+)\/?$/)
  if (m3 && !RESERVED_TOP_LEVEL.has(m3[1])) return { collection: 'pages', slug: m3[1] }
  return null
}

/**
 * Sticky banner rendered at the top of the front-end when Next draft mode is on
 * (i.e. an editor came in via the admin "Preview" button). Resolves the document
 * for the current path so the banner can show what's being previewed, whether
 * it has pending unpublished changes, and a direct link to edit it in the admin.
 */
export async function DraftPreviewBanner() {
  const dm = await draftMode()
  if (!dm.isEnabled) return null

  const hdrs = await nextHeaders()
  const pathname = hdrs.get('x-pathname') || '/'
  const ref = parsePath(pathname)

  let doc: { id: number; title: string; status: 'draft' | 'published' } | null = null
  if (ref) {
    try {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: ref.collection,
        where: { slug: { equals: ref.slug } },
        limit: 1,
        depth: 0,
        draft: true,
        overrideAccess: true,
      })
      const found = result.docs[0] as
        | { id: number; title?: string; _status?: 'draft' | 'published' }
        | undefined
      if (found) {
        doc = {
          id: found.id,
          title: found.title ?? ref.slug,
          status: found._status === 'published' ? 'published' : 'draft',
        }
      }
    } catch {
      // ignore — fall back to the minimal banner
    }
  }

  return (
    <div className="bg-zinc-900 text-zinc-100 text-xs sm:text-sm tracking-wide py-2 px-4 font-medium flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
      <span className="inline-flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"
        />
        Draft preview · not visible to customers
      </span>

      {doc ? (
        <>
          <span aria-hidden className="text-zinc-500">
            ·
          </span>
          <span>
            <span className="text-zinc-400">Editing</span>{' '}
            <span className="text-white">{doc.title}</span>
          </span>
          <span aria-hidden className="text-zinc-500">
            ·
          </span>
          <span
            className={
              doc.status === 'draft'
                ? 'text-amber-300'
                : 'text-emerald-300'
            }
          >
            {doc.status === 'draft' ? 'Unpublished changes' : 'No pending changes'}
          </span>
          <span aria-hidden className="text-zinc-500">
            ·
          </span>
          <Link
            href={`/admin/collections/${ref!.collection}/${doc.id}`}
            className="underline underline-offset-2 hover:text-white transition-colors"
          >
            Edit in admin
          </Link>
        </>
      ) : null}

      <span aria-hidden className="text-zinc-500">
        ·
      </span>
      <ExitPreviewLink />
    </div>
  )
}
