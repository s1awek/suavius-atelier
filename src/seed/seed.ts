import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config.js'
import type { Category, Media, Page, Product } from '../payload-types.js'

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

type ContentBlock = { type: 'h2' | 'p'; text: string }

type PageSeed = {
  slug: string
  title: string
  seoTitle?: string
  seoDescription?: string
  blocks: ContentBlock[]
}

const PAGES: PageSeed[] = [
  {
    slug: 'about',
    title: 'About',
    seoDescription:
      'Suavius Atelier - hand-designed PCB coasters and laser-engraved wood accessories, made in small batches.',
    blocks: [
      { type: 'p', text: 'Suavius Atelier is a small studio making objects at the intersection of electronics manufacturing and traditional craft. Every piece is designed in-house and produced in small batches.' },
      { type: 'h2', text: 'Materials' },
      { type: 'p', text: 'Our PCB coasters are manufactured on FR4 fiberglass substrate with ENIG (Electroless Nickel Immersion Gold) finish - the same process used for high-reliability electronics. The result is a piece that is heat-resistant, waterproof, and ages beautifully.' },
      { type: 'p', text: 'Our wood pieces are cut from European hardwoods and finished with food-safe linseed oil. Patterns are burned with a CO2 laser - no inks, no varnishes that flake.' },
      { type: 'h2', text: 'Where things are made' },
      { type: 'p', text: 'Design, prototyping, and finishing happen in our studio in Poland. PCB fabrication is done by partner factories in Shenzhen and assembled here. Wood is cut, engraved, and finished entirely in-house.' },
    ],
  },
  {
    slug: 'shipping-returns',
    title: 'Shipping & Returns',
    seoDescription: 'Worldwide shipping from Poland. 14-day returns on unused items.',
    blocks: [
      { type: 'h2', text: 'Shipping' },
      { type: 'p', text: 'We ship from Poland. EU orders are dispatched within 2-3 business days and typically arrive in 3-7 working days. Worldwide orders take 7-14 working days depending on destination.' },
      { type: 'p', text: 'Shipping costs are calculated at checkout based on destination and weight.' },
      { type: 'h2', text: 'Returns' },
      { type: 'p', text: 'You may return any unused item within 14 days of delivery for a full refund (excluding original shipping). Items must be in their original condition and packaging.' },
      { type: 'p', text: 'To start a return, email orders@suaviusatelier.com with your order number. Return shipping is at your expense unless the item arrived damaged.' },
      { type: 'h2', text: 'Damaged or lost shipments' },
      { type: 'p', text: 'If your order arrives damaged or never arrives, contact us within 30 days and we will replace it or refund in full.' },
    ],
  },
  {
    slug: 'faq',
    title: 'FAQ',
    seoDescription: 'Common questions about Suavius Atelier products, materials, and shipping.',
    blocks: [
      { type: 'h2', text: 'Are PCB coasters food-safe?' },
      { type: 'p', text: 'The ENIG finish is inert and food-contact safe. We still recommend treating them as you would any tableware - wash with mild soap, dry promptly.' },
      { type: 'h2', text: 'How heat-resistant are the PCB coasters?' },
      { type: 'p', text: 'FR4 is rated up to around 130°C continuous. A hot mug of coffee or tea is well within that range.' },
      { type: 'h2', text: 'Do you offer custom designs?' },
      { type: 'p', text: 'Yes, for batches of 25 or more. Email orders@suaviusatelier.com with your idea.' },
      { type: 'h2', text: 'What if I receive a damaged item?' },
      { type: 'p', text: 'Contact us within 30 days of delivery and we will replace it or refund in full. See our Shipping & Returns page for details.' },
      { type: 'h2', text: 'Do you ship outside the EU?' },
      { type: 'p', text: 'Yes, worldwide. Local taxes and duties may apply on arrival and are the buyer responsibility.' },
    ],
  },
  {
    slug: 'contact',
    title: 'Contact',
    seoDescription: 'Get in touch with Suavius Atelier.',
    blocks: [
      { type: 'p', text: 'For orders, returns, and general questions, email orders@suaviusatelier.com. We typically reply within one business day.' },
      { type: 'p', text: 'For custom design inquiries, wholesale, or press, write to the same address with a short note about what you are looking for.' },
    ],
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

function richTextFromBlocks(blocks: ContentBlock[]) {
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: blocks.map((b) => {
        const textNode = {
          type: 'text',
          version: 1,
          text: b.text,
          format: 0,
          detail: 0,
          mode: 'normal',
          style: '',
        }
        if (b.type === 'h2') {
          return {
            type: 'heading',
            tag: 'h2',
            version: 1,
            format: '' as const,
            indent: 0,
            direction: 'ltr' as const,
            children: [textNode],
          }
        }
        return {
          type: 'paragraph',
          version: 1,
          format: '' as const,
          indent: 0,
          direction: 'ltr' as const,
          children: [textNode],
        }
      }),
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
  collection: 'categories' | 'products' | 'pages',
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

  payload.logger.info('Seeding pages...')
  for (const pg of PAGES) {
    const existing = await findBySlug<Page>(payload, 'pages', pg.slug)
    if (existing) {
      payload.logger.info(`  - exists: ${pg.slug}`)
      continue
    }
    await payload.create({
      collection: 'pages',
      data: {
        title: pg.title,
        slug: pg.slug,
        seoTitle: pg.seoTitle,
        seoDescription: pg.seoDescription,
        content: richTextFromBlocks(pg.blocks),
      },
    })
    payload.logger.info(`  + created: ${pg.slug}`)
  }

  payload.logger.info('Done.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
