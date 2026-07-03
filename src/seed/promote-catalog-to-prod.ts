import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { getPayload } from 'payload'
import config from '../payload.config.js'
import type { Category, Media, Product } from '../payload-types.js'

/**
 * PROMOTE the real catalog (6 products + new photos + videos + design collections) from the
 * DEV state onto PRODUCTION, so the live store matches localhost exactly (taxonomy, gallery
 * order, videos, collection membership).
 *
 * This is a pure REPLAY of two manifests captured from the dev DB:
 *   .workspace/dev-catalog-manifest.json      (products: fields, variants, ordered gallery, video)
 *   .workspace/dev-collections-manifest.json  (collections: fields, hero, members)
 *
 * Media bytes:
 *   - new front/reverse/view  -> local `.workspace/photo-swap-out/<folder>/<cleanName>`
 *   - video + poster          -> local `.workspace/video-out/<slug>/<cleanName>`
 *   - styled + regional hero  -> fetched from the SHARED R2 bucket (public URL) by clean name
 * Everything is uploaded under CLEAN SEO names (the dev `-staged` suffix was a dev-only
 * upload transform; prod gets the permanent names). Uploading overwrites the stale
 * clean-named objects from the original seed in the shared bucket, which DEV does not
 * reference (dev points at `-staged`), so dev is left untouched.
 *
 * Dummies are unpublished (draft) to preserve test-order integrity. Idempotent: re-running
 * rebuilds each product and prunes its previous media.
 *
 * Run (prod):
 *   DATABASE_URL="<prod-neon-pooled>" NODE_ENV=production \
 *     NODE_OPTIONS=--no-deprecation npx tsx src/seed/promote-catalog-to-prod.ts
 */

const WORKSPACE = new URL('../../.workspace/', import.meta.url).pathname
const PHOTO_SWAP_ROOT = join(WORKSPACE, 'photo-swap-out')
const VIDEO_ROOT = join(WORKSPACE, 'video-out')

const DUMMY_SLUGS = ['copper-circuit-coaster', 'constellation-pcb-coaster', 'walnut-grove-trivet']

// slug -> .workspace/photo-swap-out/<folder> (source dir for the new front/reverse/view photos)
const PHOTO_FOLDER: Record<string, string> = {
  'tennis-court-pcb-coaster': 'tennis',
  'black-marble-gold-pcb-coaster': 'lava-golded',
  'gold-rings-pcb-coaster': 'golden-egg',
  'autumn-forest-pcb-coaster': 'forest',
  'topographic-pcb-coaster': 'topography',
  'ash-wood-coaster': 'Wood',
}

type MediaRef = { filename: string; alt: string }
type ProductManifest = {
  slug: string
  title: string
  price: number
  compare_at_price: number | null
  material: 'pcb' | 'wood' | 'other'
  weight_grams: number | null
  dimensions_width_mm: number | null
  dimensions_height_mm: number | null
  dimensions_depth_mm: number | null
  seo_title: string | null
  seo_description: string | null
  description: unknown
  category_slug: string
  variants: Array<{ name: string; sku: string; stock: number }> | null
  gallery: MediaRef[]
  video_file: MediaRef | null
  video_poster: MediaRef | null
}
type CollectionManifest = {
  slug: string
  title: string
  subtitle: string | null
  tagline: string | null
  order: number | null
  seo_title: string | null
  seo_description: string | null
  description: unknown
  hero_filename: string | null
  hero_alt: string | null
  members: string[] | null
}

const cleanName = (filename: string) => filename.replace('-staged', '')
const mimeOf = (name: string) => (name.toLowerCase().endsWith('.mp4') ? 'video/mp4' : 'image/webp')

async function readJson<T>(name: string): Promise<T> {
  return JSON.parse(await readFile(join(WORKSPACE, name), 'utf8')) as T
}

/** Resolve the bytes for a media file: local source if present, else fetch from shared R2. */
async function bytesFor(slug: string, name: string): Promise<Buffer> {
  const local = [
    join(PHOTO_SWAP_ROOT, PHOTO_FOLDER[slug] ?? '', name),
    join(VIDEO_ROOT, slug, name),
  ].find((p) => existsSync(p))
  if (local) return readFile(local)

  const base = process.env.R2_PUBLIC_URL
  if (!base) throw new Error('R2_PUBLIC_URL required to fetch styled/hero bytes')
  const url = `${base}/media/${name}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function run() {
  const dbHost = (process.env.DATABASE_URL ?? '').match(/@([^/:]+)/)?.[1] ?? '(unknown)'
  if (dbHost.includes('damp-mouse')) {
    throw new Error(`Refusing to run: DATABASE_URL points at DEV (${dbHost}). This script targets PROD.`)
  }
  if (process.env.NODE_ENV !== 'production') {
    throw new Error('Refusing to run without NODE_ENV=production (avoids dev-push against prod).')
  }

  const products = await readJson<ProductManifest[]>('dev-catalog-manifest.json')
  const collections = await readJson<CollectionManifest[]>('dev-collections-manifest.json')

  const payload = await getPayload({ config: await config })
  payload.logger.info(`PROMOTE catalog to PROD (db host: ${dbHost})`)

  // media clean filename -> prod media id, for wiring collection heroes
  const mediaIdByName = new Map<string, number>()

  const findBySlug = async (
    collection: 'categories' | 'products' | 'collections',
    slug: string,
  ) => {
    const res = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0 })
    return res.docs[0] as { id: number } | undefined
  }

  const uploadMedia = async (slug: string, ref: MediaRef): Promise<number> => {
    const name = cleanName(ref.filename)
    const cached = mediaIdByName.get(name)
    if (cached) return cached
    const buffer = await bytesFor(slug, name)
    const media = (await payload.create({
      collection: 'media',
      data: { alt: ref.alt },
      file: { data: buffer, mimetype: mimeOf(name), name, size: buffer.byteLength },
    })) as Media
    mediaIdByName.set(name, media.id)
    return media.id
  }

  // 1. Categories must already exist on prod.
  const categoryBySlug = new Map<string, number>()
  for (const s of ['pcb-coasters', 'wood-pieces']) {
    const cat = await findBySlug('categories', s)
    if (!cat) throw new Error(`Missing category "${s}" on prod`)
    categoryBySlug.set(s, cat.id)
  }

  // 2. Unpublish dummy placeholders (kept as drafts for order integrity).
  payload.logger.info('Unpublishing dummy placeholders...')
  for (const slug of DUMMY_SLUGS) {
    const d = await findBySlug('products', slug)
    if (d) {
      await payload.update({ collection: 'products', id: d.id, data: { _status: 'draft' } })
      payload.logger.info(`  - draft: ${slug}`)
    }
  }

  // 3. Rebuild each real product.
  payload.logger.info('Seeding real products...')
  for (const p of products) {
    const existing = (await findBySlug('products', p.slug)) as Product | undefined
    const staleMedia = existing
      ? ((
          await payload.find({ collection: 'products', where: { slug: { equals: p.slug } }, limit: 1, depth: 0 })
        ).docs[0] as Product)
      : undefined
    // Collect old media ids to prune after re-seed (safe: media is never order-bound).
    const oldMediaIds: number[] = []
    if (staleMedia) {
      for (const row of staleMedia.images ?? []) {
        const id = typeof row.image === 'number' ? row.image : (row.image as Media | null)?.id
        if (typeof id === 'number') oldMediaIds.push(id)
      }
      const vf = staleMedia.video?.file
      const vp = staleMedia.video?.poster
      if (typeof vf === 'number') oldMediaIds.push(vf)
      if (typeof vp === 'number') oldMediaIds.push(vp)
    }

    const imageIds: number[] = []
    for (const g of p.gallery) imageIds.push(await uploadMedia(p.slug, g))
    const videoFileId = p.video_file ? await uploadMedia(p.slug, p.video_file) : undefined
    const videoPosterId = p.video_poster ? await uploadMedia(p.slug, p.video_poster) : undefined

    const data = {
      title: p.title,
      slug: p.slug,
      category: categoryBySlug.get(p.category_slug)!,
      material: p.material,
      price: p.price,
      ...(typeof p.compare_at_price === 'number' ? { compareAtPrice: p.compare_at_price } : {}),
      description: p.description as never,
      images: imageIds.map((id) => ({ image: id })),
      ...(videoFileId || videoPosterId
        ? { video: { file: videoFileId ?? null, poster: videoPosterId ?? null } }
        : {}),
      seoTitle: p.seo_title ?? undefined,
      seoDescription: p.seo_description ?? undefined,
      weightGrams: p.weight_grams ?? undefined,
      dimensions: {
        widthMm: p.dimensions_width_mm ?? undefined,
        heightMm: p.dimensions_height_mm ?? undefined,
        depthMm: p.dimensions_depth_mm ?? undefined,
      },
      variants: (p.variants ?? []).map((v) => ({ name: v.name, sku: v.sku, stock: v.stock })),
      personalizations: [],
      _status: 'published' as const,
    }

    if (existing) {
      await payload.update({ collection: 'products', id: existing.id, data })
    } else {
      await payload.create({ collection: 'products', data })
    }
    // Prune the previous media now that the product points at the fresh uploads.
    for (const id of oldMediaIds) await payload.delete({ collection: 'media', id }).catch(() => {})
    payload.logger.info(`  + ${existing ? 'updated' : 'created'}: ${p.slug} (${imageIds.length} imgs, video ${videoFileId ? 'yes' : 'no'})`)
  }

  // 4. Collections (design themes) — create or update to match dev.
  payload.logger.info('Populating collections...')
  for (const c of collections) {
    const heroId = c.hero_filename
      ? await uploadMedia(
          // regional hero has no product slug context; any slug works (falls through to R2)
          c.members?.[0] ?? c.slug,
          { filename: c.hero_filename, alt: c.hero_alt ?? c.title },
        )
      : undefined

    const memberIds: number[] = []
    for (const slug of c.members ?? []) {
      const m = await findBySlug('products', slug)
      if (m) memberIds.push(m.id)
    }

    const data = {
      title: c.title,
      slug: c.slug,
      subtitle: c.subtitle ?? undefined,
      tagline: c.tagline ?? undefined,
      description: c.description as never,
      ...(typeof c.order === 'number' ? { order: c.order } : {}),
      seoTitle: c.seo_title ?? undefined,
      seoDescription: c.seo_description ?? undefined,
      ...(heroId ? { heroImage: heroId } : {}),
      products: memberIds,
      _status: 'published' as const,
    }

    const existing = await findBySlug('collections', c.slug)
    if (existing) {
      await payload.update({ collection: 'collections', id: existing.id, data })
    } else {
      await payload.create({ collection: 'collections', data })
    }
    payload.logger.info(`  + ${existing ? 'updated' : 'created'}: ${c.slug} (${memberIds.length} members${heroId ? ' + hero' : ''})`)
  }

  payload.logger.info('Promote done. Prod now mirrors dev catalog.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
