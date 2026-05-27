import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload'
import { revalidatePaths, revalidateLayout } from '@/lib/revalidate'

type Doc = Record<string, unknown>

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined
}

/** A relationship field value may be an id or a populated doc — get the id either way. */
function relId(v: unknown): number | string | undefined {
  if (typeof v === 'number' || typeof v === 'string') return v
  if (v && typeof v === 'object' && 'id' in v) {
    const id = (v as { id: unknown }).id
    if (typeof id === 'number' || typeof id === 'string') return id
  }
  return undefined
}

/** Paths a product affects: its page, the catalog listings + home, its category
 *  listing, and any collections that include it. */
async function productPaths(doc: Doc, req: PayloadRequest): Promise<string[]> {
  const paths = ['/', '/products', '/sitemap.xml']
  const slug = str(doc.slug)
  if (slug) paths.push(`/products/${slug}`)

  const categoryId = relId(doc.category)
  if (categoryId !== undefined) {
    try {
      const cat = await req.payload.findByID({ collection: 'categories', id: categoryId, depth: 0 })
      const cSlug = str(cat?.slug)
      if (cSlug) paths.push(`/categories/${cSlug}`)
    } catch {
      // category missing/unreadable — skip its listing
    }
  }

  const id = relId(doc.id)
  if (id !== undefined) {
    try {
      const { docs } = await req.payload.find({
        collection: 'collections',
        where: { products: { in: [id] } },
        depth: 0,
        limit: 100,
      })
      for (const c of docs) {
        const cSlug = str(c.slug)
        if (cSlug) paths.push(`/collections/${cSlug}`)
      }
    } catch {
      // collection lookup failed — skip cross-revalidation
    }
  }
  return paths
}

function collectionPaths(doc: Doc): string[] {
  const paths = ['/', '/collections']
  const slug = str(doc.slug)
  if (slug) paths.push(`/collections/${slug}`)
  return paths
}

function categoryPaths(doc: Doc): string[] {
  const paths = ['/', '/products']
  const slug = str(doc.slug)
  if (slug) paths.push(`/categories/${slug}`)
  return paths
}

function pagePaths(doc: Doc): string[] {
  const paths = ['/sitemap.xml']
  const slug = str(doc.slug)
  if (slug) paths.push(`/${slug}`)
  return paths
}

/** Build afterChange + afterDelete hooks from a path resolver. afterChange also
 *  revalidates the previous doc's paths, so renames/recategorisation clear both. */
function makeHooks(resolve: (doc: Doc, req: PayloadRequest) => string[] | Promise<string[]>): {
  afterChange: CollectionAfterChangeHook
  afterDelete: CollectionAfterDeleteHook
} {
  return {
    afterChange: async ({ doc, previousDoc, req }) => {
      const paths = [
        ...(await resolve(doc as Doc, req)),
        ...(previousDoc ? await resolve(previousDoc as Doc, req) : []),
      ]
      await revalidatePaths(paths)
      return doc
    },
    afterDelete: async ({ doc, req }) => {
      await revalidatePaths(await resolve(doc as Doc, req))
      return doc
    },
  }
}

export const productRevalidate = makeHooks(productPaths)
export const collectionRevalidate = makeHooks(collectionPaths)
export const categoryRevalidate = makeHooks(categoryPaths)
export const pageRevalidate = makeHooks(pagePaths)

/** Settings feed the header/footer on every page, so revalidate the whole tree. */
export const settingsRevalidate: GlobalAfterChangeHook = async ({ doc }) => {
  await revalidateLayout()
  return doc
}
