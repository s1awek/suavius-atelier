import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config.js'
import type { Category, Media, Product } from '../payload-types.js'

type CategorySeed = {
  slug: string
  title: string
  description: string
}

type ProductSeed = {
  slug: string
  title: string
  categorySlug: string
  material: 'pcb' | 'wood' | 'other'
  price: number
  compareAtPrice?: number
  description: string
  imageSeed: string
  weightGrams: number
  dimensions: { widthMm: number; heightMm: number; depthMm: number }
}

const CATEGORIES: CategorySeed[] = [
  {
    slug: 'pcb-coasters',
    title: 'PCB Coasters',
    description:
      'FR4 fiberglass coasters with ENIG copper-gold finish and UV silkscreen designs.',
  },
  {
    slug: 'wood-pieces',
    title: 'Wood Pieces',
    description: 'Laser-engraved hardwood coasters, trivets, and small accessories.',
  },
]

const PRODUCTS: ProductSeed[] = [
  {
    slug: 'copper-circuit-coaster',
    title: 'Copper Circuit Coaster',
    categorySlug: 'pcb-coasters',
    material: 'pcb',
    price: 2900,
    compareAtPrice: 3500,
    description:
      'A FR4 PCB coaster with golden ENIG plating and a circuit-trace pattern. ' +
      'Heat-resistant, waterproof, and quietly beautiful under good light.',
    imageSeed: 'copper-circuit',
    weightGrams: 38,
    dimensions: { widthMm: 95, heightMm: 95, depthMm: 1.6 },
  },
  {
    slug: 'constellation-pcb-coaster',
    title: 'Constellation PCB Coaster',
    categorySlug: 'pcb-coasters',
    material: 'pcb',
    price: 3200,
    description:
      'Star map etched on dark blue FR4 with brushed copper points. Each coaster ' +
      'maps a real constellation from the northern sky.',
    imageSeed: 'constellation',
    weightGrams: 38,
    dimensions: { widthMm: 95, heightMm: 95, depthMm: 1.6 },
  },
  {
    slug: 'walnut-grove-trivet',
    title: 'Walnut Grove Trivet',
    categorySlug: 'wood-pieces',
    material: 'wood',
    price: 4900,
    description:
      'Solid walnut trivet, laser-engraved with a topographic grove pattern. ' +
      'Finished with food-safe linseed oil.',
    imageSeed: 'walnut-grove',
    weightGrams: 180,
    dimensions: { widthMm: 180, heightMm: 180, depthMm: 12 },
  },
]

function richTextDoc(text: string) {
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: [
        {
          type: 'paragraph',
          version: 1,
          format: '' as const,
          indent: 0,
          direction: 'ltr' as const,
          children: [
            {
              type: 'text',
              version: 1,
              text,
              format: 0,
              detail: 0,
              mode: 'normal',
              style: '',
            },
          ],
        },
      ],
    },
  }
}

async function fetchPlaceholderImage(seed: string): Promise<Buffer> {
  const url = `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/1200`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch placeholder for "${seed}": ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function findBySlug<T extends { slug?: string | null }>(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: 'categories' | 'products',
  slug: string,
): Promise<T | null> {
  const res = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
  })
  return (res.docs[0] as unknown as T | undefined) ?? null
}

async function run() {
  const resolved = await config
  const payload = await getPayload({ config: resolved })

  payload.logger.info('Seeding categories...')
  const categoryByslug = new Map<string, Category>()
  for (const c of CATEGORIES) {
    const existing = await findBySlug<Category>(payload, 'categories', c.slug)
    if (existing) {
      payload.logger.info(`  - exists: ${c.slug}`)
      categoryByslug.set(c.slug, existing)
      continue
    }
    const created = await payload.create({
      collection: 'categories',
      data: { title: c.title, slug: c.slug, description: c.description },
    })
    payload.logger.info(`  + created: ${c.slug}`)
    categoryByslug.set(c.slug, created)
  }

  payload.logger.info('Seeding products + media...')
  for (const p of PRODUCTS) {
    const existing = await findBySlug<Product>(payload, 'products', p.slug)
    if (existing) {
      payload.logger.info(`  - exists: ${p.slug}`)
      continue
    }

    const category = categoryByslug.get(p.categorySlug)
    if (!category) throw new Error(`Missing category ${p.categorySlug}`)

    const buffer = await fetchPlaceholderImage(p.imageSeed)
    const media = (await payload.create({
      collection: 'media',
      data: { alt: `${p.title} photograph` },
      file: {
        data: buffer,
        mimetype: 'image/jpeg',
        name: `${p.slug}.jpg`,
        size: buffer.byteLength,
      },
    })) as Media

    await payload.create({
      collection: 'products',
      data: {
        title: p.title,
        slug: p.slug,
        category: category.id,
        material: p.material,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        description: richTextDoc(p.description),
        images: [{ image: media.id }],
        status: 'active',
        weightGrams: p.weightGrams,
        dimensions: p.dimensions,
      },
    })
    payload.logger.info(`  + created: ${p.slug}`)
  }

  payload.logger.info('Done.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
