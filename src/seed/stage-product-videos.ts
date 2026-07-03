import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getPayload } from 'payload'
import config from '../payload.config.js'
import type { Media, Product } from '../payload-types.js'

/**
 * SAFE STAGING of the product gallery videos onto the DEV database only.
 *
 * Dev and prod SHARE the R2 bucket (suavius-atelier-media), so we upload under
 * "-staged" filenames that can't collide with any live SEO-named object, and we
 * only ever delete media that a PRIOR run of THIS script created (staged, dev-only).
 * Prod is left completely untouched; a later cutover promotes the bytes.
 *
 * Assets come from `.workspace/video-out/<slug>/`:
 *   - <slug>-video.mp4          web-optimized H.264 loop (~15s, front+back)
 *   - <slug>-video-poster.webp  poster frame / gallery thumbnail
 *
 * Run: cross-env NODE_OPTIONS=--no-deprecation tsx src/seed/stage-product-videos.ts
 */

const VIDEO_ROOT = new URL('../../.workspace/video-out/', import.meta.url).pathname

const PRODUCTS = [
  'tennis-court-pcb-coaster',
  'black-marble-gold-pcb-coaster',
  'gold-rings-pcb-coaster',
  'autumn-forest-pcb-coaster',
  'topographic-pcb-coaster',
  'ash-wood-coaster',
]

/** Insert `-staged` before the extension so the object can't collide with a live one. */
const stagedName = (file: string) => file.replace(/\.(mp4|webp)$/i, '-staged.$1')

const asMedia = (v: unknown): Media | null =>
  v && typeof v === 'object' ? (v as Media) : null

async function run() {
  const payload = await getPayload({ config: await config })

  for (const slug of PRODUCTS) {
    const res = await payload.find({
      collection: 'products',
      where: { slug: { equals: slug } },
      depth: 1,
      limit: 1,
    })
    const product = res.docs[0] as Product | undefined
    if (!product) {
      payload.logger.warn(`  ! product ${slug} not found, skipping`)
      continue
    }

    // Clean up staged media from a prior run of THIS script (dev-only, safe to delete).
    for (const prev of [asMedia(product.video?.file), asMedia(product.video?.poster)]) {
      if (prev && (prev.filename ?? '').includes('-staged')) {
        await payload.delete({ collection: 'media', id: prev.id }).catch(() => {})
      }
    }

    const upload = async (file: string, mimetype: string, alt: string) => {
      const buffer = await readFile(join(VIDEO_ROOT, slug, file))
      const name = stagedName(file)
      const media = (await payload.create({
        collection: 'media',
        data: { alt },
        file: { data: buffer, mimetype, name, size: buffer.byteLength },
      })) as Media
      return media.id
    }

    const fileId = await upload(`${slug}-video.mp4`, 'video/mp4', `${product.title} product video`)
    const posterId = await upload(
      `${slug}-video-poster.webp`,
      'image/webp',
      `${product.title} video poster`,
    )

    await payload.update({
      collection: 'products',
      id: product.id,
      data: { video: { file: fileId, poster: posterId }, _status: 'published' },
    })
    payload.logger.info(`  + ${slug}: video + poster staged`)
  }

  payload.logger.info('Video staging done (dev only). Prod R2 objects untouched.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
