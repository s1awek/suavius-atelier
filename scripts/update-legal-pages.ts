// Force production mode BEFORE importing Payload: in dev mode Payload tries to
// drizzle-push the schema, which is destructive against a real DB and poisons the
// Neon pooler. This script only reads/updates existing rows, so push is never wanted.
// (Object.assign, not direct assignment: process.env.NODE_ENV is typed read-only.)
Object.assign(process.env, { NODE_ENV: 'production' })

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import { PAGES, richTextFromBlocks } from '../src/seed/seed.js'

/**
 * Refresh the content of DB-stored legal/content pages from the canonical definitions
 * in src/seed/seed.ts, WITHOUT touching anything else (products, settings, other pages).
 *
 * The DB is chosen by DATABASE_URL, so run it once per environment:
 *   pnpm exec tsx scripts/update-legal-pages.ts                 # default slugs, current .env DB
 *   pnpm exec tsx scripts/update-legal-pages.ts privacy cookies # explicit slugs
 *   DATABASE_URL="<prod-url>" pnpm exec tsx scripts/update-legal-pages.ts   # against prod
 */
const DEFAULT_SLUGS = ['privacy', 'cookies']

async function run() {
  const slugs = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_SLUGS

  const resolved = await config
  const payload = await getPayload({ config: resolved })

  const dbHost = (process.env.DATABASE_URL ?? '').replace(/.*@/, '').replace(/\/.*$/, '')
  payload.logger.info(`Updating legal pages on DB host: ${dbHost || '(unknown)'}`)

  for (const slug of slugs) {
    const def = PAGES.find((p) => p.slug === slug)
    if (!def) {
      payload.logger.warn(`  - no seed definition for slug "${slug}", skipping`)
      continue
    }

    const found = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    const existing = found.docs[0]
    if (!existing) {
      payload.logger.warn(`  - page "${slug}" not found in DB, skipping (run the seed first)`)
      continue
    }

    await payload.update({
      collection: 'pages',
      id: existing.id,
      data: {
        title: def.title,
        seoTitle: def.seoTitle ?? null,
        seoDescription: def.seoDescription ?? null,
        content: richTextFromBlocks(def.blocks),
      },
    })
    payload.logger.info(`  - updated: ${slug} (id ${existing.id})`)
  }

  payload.logger.info('Done.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
