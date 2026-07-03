import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getPayload } from 'payload'
import config from '../payload.config.js'
import { richTextFromBlocks, type ContentBlock } from './seed.js'
import type { Category, Media, Product } from '../payload-types.js'

/**
 * Seed the 6 real products (5 PCB coasters + 1 ash wood) with their processed WebP
 * photography, populate the design-theme collections, and add the wood "register interest"
 * personalization option. Idempotent: re-running deletes + rebuilds each target product
 * (and its media) so image sets and copy stay in sync with this file.
 *
 * Images come from scripts/process-product-images.mjs output:
 *   <PHOTO_ROOT>/<folder>/web/manifest.json  ->  [{ file, role, alt }]
 *
 * Run: cross-env NODE_OPTIONS=--no-deprecation tsx src/seed/seed-real-products.ts
 */

const PHOTO_ROOT = '/home/op/Pictures/100CANON/processed/products'

// Dummy picsum placeholders from src/seed/seed.ts — removed so the catalog is real only.
const DUMMY_SLUGS = [
  'copper-circuit-coaster',
  'constellation-pcb-coaster',
  'walnut-grove-trivet',
]

type ProductSeed = {
  folder: string
  slug: string
  title: string
  categorySlug: 'pcb-coasters' | 'wood-pieces'
  material: 'pcb' | 'wood'
  price: number
  weightGrams: number
  depthMm: number // thickness; widthMm carries the diameter, heightMm intentionally unset (round)
  collectionSlug: 'sport' | 'botanical' | 'abstract' | null
  blocks: ContentBlock[]
  seoTitle: string
  seoDescription: string
}

const PRODUCTS: ProductSeed[] = [
  {
    folder: '01-tennis-court',
    slug: 'tennis-court-pcb-coaster',
    title: 'Tennis Court PCB Coaster',
    categorySlug: 'pcb-coasters',
    material: 'pcb',
    price: 6900,
    weightGrams: 38,
    depthMm: 1.6,
    collectionSlug: 'sport',
    blocks: [
      { type: 'p', text: 'An aerial tennis court in clay-court red and crisp white lines, rendered on a fiberglass canvas. The kind of detail that rewards a second look, a quiet nod to the game beneath your morning espresso.' },
      { type: 'p', text: 'Each piece is fabricated like a circuit board: an FR4 fiberglass core with ENIG gold plating and a UV-cured print. Heat-resistant, waterproof, and built to outlast anything printed on cork or card. The reverse carries a gilded pattern and the Suavius monogram, as considered upside down as it is in use.' },
      { type: 'p', text: 'Roughly 10 cm across and 1.6 mm thin. Wipe clean; it will not warp, stain, or fade.' },
    ],
    seoTitle: 'Tennis Court PCB Coaster - Gold-Finish Art Coaster',
    seoDescription:
      'A clay-court tennis design on a gold-plated FR4 coaster. Heat-resistant, waterproof, about 10 cm. Made in small batches by Suavius Atelier, shipped from Poland.',
  },
  {
    folder: '02-marble-gold',
    slug: 'black-marble-gold-pcb-coaster',
    title: 'Black Marble & Gold PCB Coaster',
    categorySlug: 'pcb-coasters',
    material: 'pcb',
    price: 6900,
    weightGrams: 38,
    depthMm: 1.6,
    collectionSlug: 'abstract',
    blocks: [
      { type: 'p', text: 'Veins of gold drawn across deep black marble, the look of a rare stone slab shrunk to the size of your cup. Quietly opulent, never loud.' },
      { type: 'p', text: 'It is made like a circuit board, not a tile: an FR4 fiberglass core finished in ENIG gold with a UV-cured print, so the gold is real plating rather than ink. Heat-resistant, waterproof, and at home on a desk, a bar cart, or a side table. The reverse is gilded and carries the Suavius monogram.' },
      { type: 'p', text: 'About 10 cm across and 1.6 mm thin. A single wipe keeps it pristine.' },
    ],
    seoTitle: 'Black Marble & Gold PCB Coaster - Luxe Art Coaster',
    seoDescription:
      'Black marble with gold veining on a gold-plated FR4 coaster. Heat-resistant, waterproof, about 10 cm. Small-batch, made by Suavius Atelier in Poland.',
  },
  {
    folder: '03-minimal-gold-rings',
    slug: 'gold-rings-pcb-coaster',
    title: 'Gold Rings PCB Coaster',
    categorySlug: 'pcb-coasters',
    material: 'pcb',
    price: 6900,
    weightGrams: 38,
    depthMm: 1.6,
    collectionSlug: 'abstract',
    blocks: [
      { type: 'p', text: 'Concentric gold rings on black, settling to a single point at the centre. Minimal, architectural, and faintly hypnotic, a piece of quiet geometry for your cup to land on.' },
      { type: 'p', text: 'Built like a circuit board: FR4 fiberglass, ENIG gold plating, a UV-cured print. The gold is plated rather than printed, so it catches the light the way metal does. Heat-resistant and waterproof, with a gilded, monogrammed reverse.' },
      { type: 'p', text: 'About 10 cm across and 1.6 mm thin. Wipe clean; it will not warp, stain, or fade.' },
    ],
    seoTitle: 'Gold Rings PCB Coaster - Minimal Gold Art Coaster',
    seoDescription:
      'Concentric gold rings on black, gold-plated FR4. Heat-resistant, waterproof, about 10 cm. Minimal design coaster, small-batch by Suavius Atelier.',
  },
  {
    folder: '04-autumn-forest',
    slug: 'autumn-forest-pcb-coaster',
    title: 'Autumn Forest PCB Coaster',
    categorySlug: 'pcb-coasters',
    material: 'pcb',
    price: 6900,
    weightGrams: 38,
    depthMm: 1.6,
    collectionSlug: 'botanical',
    blocks: [
      { type: 'p', text: 'An ancient forest seen from above in full autumn, a mosaic of amber, rust and green that reads almost like a painting. No two glances find quite the same detail.' },
      { type: 'p', text: 'The image is fabricated onto an FR4 fiberglass core with ENIG gold plating and a UV-cured print, the same process used for fine electronics. Heat-resistant, waterproof, and far more durable than paper or cork. The reverse is gilded and carries the Suavius monogram.' },
      { type: 'p', text: 'About 10 cm across and 1.6 mm thin. A quick wipe is all it needs.' },
    ],
    seoTitle: 'Autumn Forest PCB Coaster - Aerial Art Coaster',
    seoDescription:
      'An aerial autumn forest in amber and rust on gold-plated FR4. Heat-resistant, waterproof, about 10 cm. Made in small batches by Suavius Atelier.',
  },
  {
    folder: '05-topographic-teal-orange',
    slug: 'topographic-pcb-coaster',
    title: 'Topographic PCB Coaster',
    categorySlug: 'pcb-coasters',
    material: 'pcb',
    price: 6900,
    weightGrams: 38,
    depthMm: 1.6,
    collectionSlug: 'abstract',
    blocks: [
      { type: 'p', text: 'Contour lines in teal and warm orange, rippling across the surface like a map of somewhere you have not been yet. Cartography as ornament.' },
      { type: 'p', text: 'Made like a circuit board: an FR4 fiberglass core with ENIG gold plating and a UV-cured print. Heat-resistant, waterproof, and built to last. The gilded reverse carries the Suavius monogram, so it looks finished from either side.' },
      { type: 'p', text: 'About 10 cm across and 1.6 mm thin. Wipe clean; it will not warp, stain, or fade.' },
    ],
    seoTitle: 'Topographic PCB Coaster - Teal & Orange Contour Coaster',
    seoDescription:
      'Teal and orange topographic contour design on gold-plated FR4. Heat-resistant, waterproof, about 10 cm. Small-batch design coaster by Suavius Atelier.',
  },
  {
    folder: '06-wood',
    slug: 'ash-wood-coaster',
    title: 'Ash Wood Coaster',
    categorySlug: 'wood-pieces',
    material: 'wood',
    price: 4500,
    weightGrams: 55,
    depthMm: 10,
    collectionSlug: null,
    blocks: [
      { type: 'p', text: 'A clean round disc of European ash, finished by hand with oil and wax to bring out the grain. Warm, tactile, and unmistakably solid, the kind of object that feels good to pick up.' },
      { type: 'p', text: 'We are starting with the wood exactly as it is: no engraving, no print, just well-chosen ash and a careful finish. Hand-pressed gold-foil personalisation, your initials or a small mark, is on its way.' },
      { type: 'p', text: 'About 10 cm across and 10 mm thick. Wipe with a dry cloth; re-oil occasionally to keep the finish deep.' },
    ],
    seoTitle: 'Ash Wood Coaster - Hand-Finished Round Wood Coaster',
    seoDescription:
      'Round European ash coaster, hand-finished with oil and wax. About 10 cm, 10 mm thick. Small-batch, made by Suavius Atelier in Poland.',
  },
]

type CollectionSeed = {
  slug: 'sport' | 'botanical' | 'abstract' | 'regional'
  subtitle: string
  tagline: string
  description: string
}

const COLLECTIONS: CollectionSeed[] = [
  {
    slug: 'sport',
    subtitle: 'Collection · Sport',
    tagline: 'The games we love, rendered in gold.',
    description:
      'Sport distilled to a single graphic and set in fiberglass and gold. Pieces for people who play, or who simply like the geometry of a court seen from above.',
  },
  {
    slug: 'botanical',
    subtitle: 'Collection · Botanical',
    tagline: 'The natural world, seen from above.',
    description:
      'Forests, fields and growing things, abstracted into pattern. Botanical pieces trade literal flowers for the textures of nature at altitude.',
  },
  {
    slug: 'abstract',
    subtitle: 'Collection · Abstract',
    tagline: 'Geometry, stone and line.',
    description:
      'Where the design is the subject. Marble, contour lines and concentric rings, quiet graphic pieces that sit comfortably in a considered interior.',
  },
  {
    slug: 'regional',
    subtitle: 'Collection · Regional',
    tagline: 'Maps of the places you carry with you.',
    description:
      'Cities, coastlines and the corners of the world that mean something. This collection is in the works. Subscribe below and we will tell you the moment the first pieces are ready.',
  },
]

type ManifestEntry = { file: string; role: string; alt: string }
type UploadedImage = { role: string; mediaId: number }

const MIME_BY_EXT: Record<string, string> = {
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
}

async function findBySlug<T extends { id: number }>(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: 'categories' | 'products' | 'collections',
  slug: string,
): Promise<T | null> {
  const res = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  return (res.docs[0] as unknown as T | undefined) ?? null
}

/** Media ids a product currently references — collected before re-seed so we can prune them. */
async function productMediaIds(
  payload: Awaited<ReturnType<typeof getPayload>>,
  slug: string,
): Promise<number[]> {
  const res = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  const product = res.docs[0] as Product | undefined
  if (!product) return []
  return (product.images ?? [])
    .map((row) => (typeof row.image === 'number' ? row.image : (row.image as Media | null)?.id))
    .filter((id): id is number => typeof id === 'number')
}

/** Media is never referenced by orders, so it is always safe to delete (unlike products). */
async function deleteMedia(
  payload: Awaited<ReturnType<typeof getPayload>>,
  ids: number[],
): Promise<void> {
  for (const id of ids) await payload.delete({ collection: 'media', id }).catch(() => {})
}

/**
 * Dummy placeholders may be referenced by existing test orders (orders_items.product_id is
 * NOT NULL), so we unpublish rather than delete — order history stays intact and the product
 * disappears from the published storefront.
 */
async function unpublishProduct(
  payload: Awaited<ReturnType<typeof getPayload>>,
  slug: string,
): Promise<void> {
  const existing = await findBySlug<{ id: number }>(payload, 'products', slug)
  if (!existing) return
  await payload.update({ collection: 'products', id: existing.id, data: { _status: 'draft' } })
  payload.logger.info(`  - unpublished dummy: ${slug}`)
}

async function uploadImages(
  payload: Awaited<ReturnType<typeof getPayload>>,
  folder: string,
): Promise<UploadedImage[]> {
  const webDir = join(PHOTO_ROOT, folder, 'web')
  const manifest = JSON.parse(
    await readFile(join(webDir, 'manifest.json'), 'utf8'),
  ) as ManifestEntry[]

  const out: UploadedImage[] = []
  for (const entry of manifest) {
    const buffer = await readFile(join(webDir, entry.file))
    const ext = entry.file.split('.').pop()?.toLowerCase() ?? 'webp'
    const media = (await payload.create({
      collection: 'media',
      data: { alt: entry.alt },
      file: {
        data: buffer,
        mimetype: MIME_BY_EXT[ext] ?? 'image/webp',
        name: entry.file,
        size: buffer.byteLength,
      },
    })) as Media
    out.push({ role: entry.role, mediaId: media.id })
  }
  return out
}

async function run() {
  const resolved = await config
  const payload = await getPayload({ config: resolved })

  // 1. Categories (must already exist from the base seed).
  const categoryBySlug = new Map<string, Category>()
  for (const slug of ['pcb-coasters', 'wood-pieces']) {
    const cat = await findBySlug<Category>(payload, 'categories', slug)
    if (!cat) throw new Error(`Missing category "${slug}" — run "pnpm seed" first.`)
    categoryBySlug.set(slug, cat)
  }

  // 2. Unpublish dummy placeholders (kept for order integrity).
  payload.logger.info('Unpublishing dummy placeholder products...')
  for (const slug of DUMMY_SLUGS) await unpublishProduct(payload, slug)

  // 3. Upsert the real products (update-or-create; prune the old media after, since media is
  //    safe to delete even when the product itself is referenced by a test order).
  payload.logger.info('Seeding real products + photography...')
  const imagesBySlug = new Map<string, UploadedImage[]>()
  const productIdBySlug = new Map<string, number>()

  for (const p of PRODUCTS) {
    // Delete the old media FIRST so the new uploads reclaim the clean SEO filenames
    // (otherwise Payload increments to -4/-5/... to avoid colliding with the stale R2 objects).
    const staleMedia = await productMediaIds(payload, p.slug)
    await deleteMedia(payload, staleMedia)

    const uploaded = await uploadImages(payload, p.folder)
    imagesBySlug.set(p.slug, uploaded)

    const data = {
      title: p.title,
      slug: p.slug,
      category: categoryBySlug.get(p.categorySlug)!.id,
      material: p.material,
      price: p.price,
      description: richTextFromBlocks(p.blocks),
      images: uploaded.map((u) => ({ image: u.mediaId })),
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      weightGrams: p.weightGrams,
      // Round pieces: widthMm = diameter, heightMm left unset so the PDP renders "Ø …".
      dimensions: { widthMm: 100, depthMm: p.depthMm },
      variants: [{ name: 'Standard', sku: `${p.slug}-standard`, stock: 25 }],
      // Interest in gold-foil wood personalisation is now captured via the one-step
      // RegisterInterestDialog (product-interest collection), not a cart option.
      personalizations: [],
      _status: 'published' as const,
    }

    const existing = await findBySlug<{ id: number }>(payload, 'products', p.slug)
    let productId: number
    if (existing) {
      await payload.update({ collection: 'products', id: existing.id, data })
      productId = existing.id
    } else {
      const created = await payload.create({ collection: 'products', data })
      productId = created.id
    }
    productIdBySlug.set(p.slug, productId)
    payload.logger.info(`  + ${existing ? 'updated' : 'created'}: ${p.slug} (${uploaded.length} images)`)
  }

  // 4. Remove the old cart-bound "register interest" personalization option (replaced by the
  //    one-step RegisterInterestDialog -> product-interest collection). Idempotent cleanup.
  payload.logger.info('Removing legacy register-interest personalization option...')
  const legacyOpt = await payload.find({
    collection: 'personalization-options',
    where: { label: { equals: 'Personalisation' } },
    limit: 1,
    depth: 0,
  })
  if (legacyOpt.docs[0]) {
    await payload
      .delete({ collection: 'personalization-options', id: legacyOpt.docs[0].id })
      .catch(() => {})
    payload.logger.info('  - removed legacy "Personalisation" option')
  }

  // 5. Populate the design-theme collections (and refresh the Regional placeholder).
  payload.logger.info('Populating collections...')
  for (const c of COLLECTIONS) {
    const existing = await findBySlug<{ id: number }>(payload, 'collections', c.slug)
    if (!existing) {
      payload.logger.warn(`  ! collection "${c.slug}" not found, skipping`)
      continue
    }
    const members = PRODUCTS.filter((p) => p.collectionSlug === c.slug)
    const productIds = members.map((p) => productIdBySlug.get(p.slug)!).filter(Boolean)

    // Hero = the first member's styled lifestyle shot (fall back to its first image).
    let heroImage: number | undefined
    const firstMember = members[0]
    if (firstMember) {
      const imgs = imagesBySlug.get(firstMember.slug) ?? []
      heroImage = (imgs.find((i) => i.role === 'styled') ?? imgs[0])?.mediaId
    }

    await payload.update({
      collection: 'collections',
      id: existing.id,
      data: {
        subtitle: c.subtitle,
        tagline: c.tagline,
        description: richTextFromBlocks([{ type: 'p', text: c.description }]),
        ...(heroImage ? { heroImage } : {}),
        products: productIds,
        _status: 'published',
      },
    })
    payload.logger.info(`  + ${c.slug}: ${productIds.length} products${heroImage ? ' + hero' : ''}`)
  }

  payload.logger.info('Done.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
