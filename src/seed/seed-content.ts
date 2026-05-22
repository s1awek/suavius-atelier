import 'dotenv/config'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'
import config from '../payload.config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')

type Block = { type: 'h2' | 'h3' | 'p'; text: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function richTextFromBlocks(blocks: Block[]): any {
  return {
    root: {
      type: 'root',
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr',
      children: blocks.map((b) => {
        if (b.type === 'h2' || b.type === 'h3') {
          return {
            type: 'heading',
            tag: b.type,
            version: 1,
            format: '',
            indent: 0,
            direction: 'ltr',
            children: [
              { type: 'text', version: 1, text: b.text, format: 0, mode: 'normal', style: '', detail: 0 },
            ],
          }
        }
        return {
          type: 'paragraph',
          version: 1,
          format: '',
          indent: 0,
          direction: 'ltr',
          children: [
            { type: 'text', version: 1, text: b.text, format: 0, mode: 'normal', style: '', detail: 0 },
          ],
        }
      }),
    },
  }
}

const ABOUT_BLOCKS: Block[] = [
  {
    type: 'p',
    text: 'Suavius Atelier is a small design studio in Bielawa, in the Lower Silesia region of Poland. We make objects for the desk - coasters, trivets, headphone stands, small organisers - in materials that are not usually given that level of care: fibreglass, gold-plated copper, hardwood, polished resin.',
  },
  {
    type: 'p',
    text: 'The studio began with a question. Why is everything on a working desk either disposable plastic or untouchable luxury? There is a category missing: small, deliberate objects, made with the materials of fine electronics and traditional craft, sold at prices that working people can justify.',
  },
  {
    type: 'h2',
    text: 'How we work',
  },
  {
    type: 'p',
    text: 'Every piece is drawn here, by hand or with the same software that engineers use for production-grade circuit boards. We design in small bodies of work - collections of four to eight pieces around a single idea - rather than scattering ourselves across a hundred SKUs.',
  },
  {
    type: 'p',
    text: 'Fabrication of our PCB pieces is done by a specialist partner in Shenzhen, the city that has set the global standard for precision board manufacturing. We chose that path honestly: it is the right tool for the job. Wood pieces are cut, engraved, finished, and packed entirely in our own studio.',
  },
  {
    type: 'p',
    text: 'Every order is checked by hand, packed in our own packaging, and shipped from Bielawa. The note in the box is real.',
  },
  {
    type: 'h2',
    text: 'What we believe',
  },
  {
    type: 'p',
    text: 'Small batches over endless inventory. We retire designs when they are done, rather than discounting them into oblivion. If a piece sells out, you may have to wait for the next run - or it may never come back. That is the point.',
  },
  {
    type: 'p',
    text: 'Honest materials. FR4 is FR4. Gold is real gold. Walnut is walnut. We do not laminate cheap things with veneer and hope you do not notice.',
  },
  {
    type: 'p',
    text: 'Transparent sourcing. We are open about what we make ourselves and what we commission. Hiding that is a luxury industry habit we are not interested in repeating.',
  },
  {
    type: 'p',
    text: 'Designed for the long quiet. The objects we like best are the ones we stop noticing - because they work, every day, for a long time. We try to make those.',
  },
  {
    type: 'h2',
    text: 'The maker',
  },
  {
    type: 'p',
    text: 'Suavius Atelier is run by Sławomir Kasprzak, a designer and software engineer who has spent fifteen years building digital products and now spends a portion of each week making physical ones. The studio is his alone for now. If you write to us, you write to him.',
  },
]

const COLLECTIONS = [
  {
    slug: 'botanical',
    title: 'Botanical',
    subtitle: 'Collection 01',
    tagline: 'Quiet studies of growing things, drawn on copper.',
    descriptionBlocks: [
      {
        type: 'p' as const,
        text: 'Flowers, ferns, fungi, fruiting branches. The botanical collection takes the most domestic of subjects - the plants that share our rooms - and prints them on a substrate built for satellites. The contrast is the point.',
      },
      {
        type: 'p' as const,
        text: 'Each piece is a quiet study, drawn or rendered in our studio, separated into colour layers, and printed in UV-cured ink that does not fade in sunlight.',
      },
    ],
    order: 10,
    seoTitle: 'Botanical Collection',
    seoDescription:
      'Botanical PCB and wood pieces from Suavius Atelier - flowers, ferns, fungi, leaves printed in UV ink on gold-plated copper.',
  },
  {
    slug: 'sport',
    title: 'Sport',
    subtitle: 'Collection 02',
    tagline: 'For the people whose desk faces the screen on a match day.',
    descriptionBlocks: [
      {
        type: 'p' as const,
        text: 'Footballs that are naturally round. Tennis balls fuzzed in cross-hatched copper. Golf, basketball, baseball - the iconography of the sports that occupy our weekends, made into small heirloom objects for the desk that watches them.',
      },
      {
        type: 'p' as const,
        text: 'Sold as singles or in coordinated sets of four.',
      },
    ],
    order: 20,
    seoTitle: 'Sport Collection',
    seoDescription:
      'Sport-themed PCB coasters from Suavius Atelier - football, tennis, golf, basketball motifs in UV print on gold-plated copper.',
  },
  {
    slug: 'abstract',
    title: 'Abstract',
    subtitle: 'Collection 03',
    tagline: 'Geometry that holds a cup. Pattern that holds your attention.',
    descriptionBlocks: [
      {
        type: 'p' as const,
        text: 'Mosaics, mandalas, tessellations, generative grids. The abstract collection is where we let the medium speak for itself - line, fill, copper edge - without the burden of representing anything.',
      },
      {
        type: 'p' as const,
        text: 'These are the pieces we design last, and the ones that surprise us most.',
      },
    ],
    order: 30,
    seoTitle: 'Abstract Collection',
    seoDescription:
      'Abstract geometric PCB coasters from Suavius Atelier - mosaics, mandalas, tessellations on gold-plated copper.',
  },
  {
    slug: 'regional',
    title: 'Regional',
    subtitle: 'Collection 04',
    tagline: 'Maps of places that matter to someone.',
    descriptionBlocks: [
      {
        type: 'p' as const,
        text: 'Cities, regions, mountain ranges, ski runs, sailing routes, hiking trails. The regional collection draws the geographies that hold our memories, and prints them on objects we keep close.',
      },
      {
        type: 'p' as const,
        text: 'These pieces are also the foundation of most of our bespoke work - if you would like a map of somewhere particular, write to us.',
      },
    ],
    order: 40,
    seoTitle: 'Regional Collection',
    seoDescription:
      'Map-based PCB coasters from Suavius Atelier - cities, regions, trails, sailing routes drawn on gold-plated copper.',
  },
]

async function main() {
  const payload = await getPayload({ config })

  payload.logger.info('Updating About page...')
  const aboutRes = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'about' } },
    limit: 1,
  })
  if (aboutRes.docs.length > 0) {
    await payload.update({
      collection: 'pages',
      id: aboutRes.docs[0].id,
      data: {
        title: 'About',
        seoTitle: 'About Suavius Atelier',
        seoDescription:
          'Suavius Atelier is a small design studio in Bielawa, Poland, making PCB and wood objects for the desk - in small batches, with honest materials, designed to outlast trends.',
        content: richTextFromBlocks(ABOUT_BLOCKS),
      },
    })
    payload.logger.info('  ✓ About updated')
  } else {
    payload.logger.warn('  - About page not found (was it seeded?)')
  }

  payload.logger.info('Seeding collections + heroes...')
  for (const c of COLLECTIONS) {
    const existing = await payload.find({
      collection: 'collections',
      where: { slug: { equals: c.slug } },
      limit: 1,
    })

    let heroMediaId: number | undefined
    const heroPath = path.join(projectRoot, '.workspace/collection-heroes', `${c.slug}.webp`)
    if (existsSync(heroPath)) {
      const fileName = `collection-hero-${c.slug}.webp`
      const existingMedia = await payload.find({
        collection: 'media',
        where: { filename: { equals: fileName } },
        limit: 1,
      })
      if (existingMedia.docs.length > 0) {
        heroMediaId = existingMedia.docs[0].id
        payload.logger.info(`    - hero exists: ${fileName}`)
      } else {
        const buffer = readFileSync(heroPath)
        const media = await payload.create({
          collection: 'media',
          data: { alt: `${c.title} collection - design preview` },
          file: {
            data: buffer,
            mimetype: 'image/webp',
            name: fileName,
            size: buffer.byteLength,
          },
        })
        heroMediaId = media.id
        payload.logger.info(`    + uploaded hero: ${fileName}`)
      }
    } else {
      payload.logger.warn(`    - hero file not found: ${heroPath}`)
    }

    const data = {
      title: c.title,
      slug: c.slug,
      subtitle: c.subtitle,
      tagline: c.tagline,
      description: richTextFromBlocks(c.descriptionBlocks),
      ...(heroMediaId ? { heroImage: heroMediaId } : {}),
      order: c.order,
      seoTitle: c.seoTitle,
      seoDescription: c.seoDescription,
    }
    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'collections',
        id: existing.docs[0].id,
        data,
      })
      payload.logger.info(`  ✓ updated: ${c.slug}`)
    } else {
      await payload.create({
        collection: 'collections',
        data,
      })
      payload.logger.info(`  + created: ${c.slug}`)
    }
  }

  payload.logger.info('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
