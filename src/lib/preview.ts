/**
 * Maps a draft-enabled collection + slug to the public path the document renders at,
 * then wraps it in a link to the draft-preview route. Used by each collection's
 * `admin.preview` so the panel's "Preview" button opens the live frontend in draft mode.
 */

export type PreviewableCollection = 'pages' | 'products' | 'collections'

const PUBLIC_PATH: Record<PreviewableCollection, (slug: string) => string> = {
  pages: (slug) => `/${slug}`,
  products: (slug) => `/products/${slug}`,
  collections: (slug) => `/collections/${slug}`,
}

export function publicPathFor(collection: PreviewableCollection, slug: string): string {
  return PUBLIC_PATH[collection](slug)
}

export function generatePreviewPath(collection: PreviewableCollection, slug: string): string {
  const params = new URLSearchParams({ path: publicPathFor(collection, slug) })
  return `/next/preview?${params.toString()}`
}
