import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config.js'
import type { Media, Product } from '../payload-types.js'

const EXTRA_IMAGES_PER_PRODUCT = 3

async function fetchPlaceholderImage(seed: string): Promise<Buffer> {
  const url = `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/1200`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch "${seed}": ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function main() {
  const payload = await getPayload({ config })

  const { docs: products } = await payload.find({
    collection: 'products',
    limit: 200,
    depth: 0,
  })

  payload.logger.info(`Found ${products.length} products`)

  for (const product of products as Product[]) {
    const current = product.images ?? []
    if (current.length >= 1 + EXTRA_IMAGES_PER_PRODUCT) {
      payload.logger.info(`  - skip ${product.slug} (already has ${current.length} images)`)
      continue
    }

    const newImageIds: number[] = []
    for (let i = 1; i <= EXTRA_IMAGES_PER_PRODUCT; i++) {
      const seed = `${product.slug}-${i}`
      payload.logger.info(`  + fetching ${seed}...`)
      const buffer = await fetchPlaceholderImage(seed)
      const media = (await payload.create({
        collection: 'media',
        data: { alt: `${product.title} photograph ${i + 1}` },
        file: {
          data: buffer,
          mimetype: 'image/jpeg',
          name: `${product.slug}-gallery-${i}.jpg`,
          size: buffer.byteLength,
        },
      })) as Media
      newImageIds.push(media.id)
    }

    const mergedImages = [
      ...current.map((row) => ({
        image: typeof row.image === 'object' && row.image !== null ? row.image.id : row.image,
      })),
      ...newImageIds.map((id) => ({ image: id })),
    ]

    await payload.update({
      collection: 'products',
      id: product.id,
      data: { images: mergedImages },
    })

    payload.logger.info(`  ✓ ${product.slug}: ${current.length} → ${mergedImages.length} images`)
  }

  payload.logger.info('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
