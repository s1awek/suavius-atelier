import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getPayload } from 'payload'
import config from '../payload.config.js'
import type { Media, Product } from '../payload-types.js'

/**
 * SAFE STAGING of the 2026-07-03 photo session onto the DEV database only.
 *
 * Dev and prod SHARE the R2 bucket (suavius-atelier-media), so we must not
 * delete or overwrite the live SEO-named objects. This script therefore:
 *   - uploads the new front/reverse/view images under "-staged" filenames
 *     (no collision with the live objects),
 *   - preserves each product's existing `styled-*` images (AI lifestyle shots
 *     whose source files are gone — they live only in R2/DB),
 *   - rewires the dev product galleries to [front, styled, reverse] (pcb) /
 *     [views, styled] (wood),
 *   - deletes ONLY previously-staged media from a prior run (safe: staged
 *     objects are dev-only), never the shared live objects.
 *
 * Prod is left completely untouched. After the owner approves on dev, a
 * separate cutover promotes the staged bytes to the final SEO names on both DBs.
 *
 * Run: cross-env NODE_OPTIONS=--no-deprecation tsx src/seed/stage-new-photos.ts
 */

const PHOTO_ROOT = new URL('../../.workspace/photo-swap-out/', import.meta.url).pathname

const PRODUCTS: { folder: string; slug: string; kind: 'pcb' | 'wood' }[] = [
  { folder: 'tennis', slug: 'tennis-court-pcb-coaster', kind: 'pcb' },
  { folder: 'lava-golded', slug: 'black-marble-gold-pcb-coaster', kind: 'pcb' },
  { folder: 'golden-egg', slug: 'gold-rings-pcb-coaster', kind: 'pcb' },
  { folder: 'forest', slug: 'autumn-forest-pcb-coaster', kind: 'pcb' },
  { folder: 'topography', slug: 'topographic-pcb-coaster', kind: 'pcb' },
  { folder: 'Wood', slug: 'ash-wood-coaster', kind: 'wood' },
]

type ManifestEntry = { file: string; role: string; alt: string }

/** Insert `-staged` before the extension so the object can't collide with the live one. */
const stagedName = (file: string) => file.replace(/\.webp$/i, '-staged.webp')

async function run() {
  const payload = await getPayload({ config: await config })

  for (const p of PRODUCTS) {
    const res = await payload.find({
      collection: 'products',
      where: { slug: { equals: p.slug } },
      depth: 1,
      limit: 1,
    })
    const product = res.docs[0] as Product | undefined
    if (!product) {
      payload.logger.warn(`  ! product ${p.slug} not found, skipping`)
      continue
    }

    const rows = product.images ?? []
    const mediaOf = (row: (typeof rows)[number]) =>
      (typeof row.image === 'number' ? null : (row.image as Media)) ?? null

    // Keep styled (AI lifestyle) media, in their existing order.
    const styledIds = rows
      .map(mediaOf)
      .filter((m): m is Media => !!m && (m.filename ?? '').includes('styled'))
      .map((m) => m.id)

    // Clean up staged media from a prior run of THIS script (dev-only, safe to delete).
    const priorStaged = rows
      .map(mediaOf)
      .filter((m): m is Media => !!m && (m.filename ?? '').includes('-staged'))
      .map((m) => m.id)
    for (const id of priorStaged) {
      await payload.delete({ collection: 'media', id }).catch(() => {})
    }

    // Upload the new images under staged filenames.
    const manifest = JSON.parse(
      await readFile(join(PHOTO_ROOT, p.folder, 'manifest.json'), 'utf8'),
    ) as ManifestEntry[]

    const uploaded: { role: string; id: number }[] = []
    for (const entry of manifest) {
      const buffer = await readFile(join(PHOTO_ROOT, p.folder, entry.file))
      const name = stagedName(entry.file)
      const media = (await payload.create({
        collection: 'media',
        data: { alt: entry.alt },
        file: { data: buffer, mimetype: 'image/webp', name, size: buffer.byteLength },
      })) as Media
      uploaded.push({ role: entry.role, id: media.id })
    }

    const idsByRole = (role: string) => uploaded.filter((u) => u.role === role).map((u) => u.id)

    // Order: pcb = front -> styled -> reverse ; wood = view -> styled.
    const ordered =
      p.kind === 'wood'
        ? [...idsByRole('view'), ...styledIds]
        : [...idsByRole('front'), ...styledIds, ...idsByRole('reverse')]

    await payload.update({
      collection: 'products',
      id: product.id,
      data: { images: ordered.map((id) => ({ image: id })), _status: 'published' },
    })
    payload.logger.info(
      `  + ${p.slug}: ${uploaded.length} new (staged) + ${styledIds.length} styled kept -> ${ordered.length} images`,
    )
  }

  payload.logger.info('Staging done (dev only). Prod R2 objects untouched.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
