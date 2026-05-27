import { PAGES, richTextFromBlocks } from '../src/seed/seed.js'

/**
 * Emits targeted UPDATE statements (no DB connection) to refresh legal page content
 * from the canonical seed definitions. Tables are schema-qualified (public.pages) so
 * the SQL is independent of the connection's search_path. Apply with:
 *   psql "<url>" -f .workspace/legal-update.sql
 */
const SLUGS = process.argv.slice(2).length ? process.argv.slice(2) : ['privacy', 'cookies']
const TAG = '$pg$' // dollar-quote tag; JSON/text never contains it

function dq(value: string): string {
  return `${TAG}${value}${TAG}`
}

const out: string[] = ['BEGIN;']
for (const slug of SLUGS) {
  const def = PAGES.find((p) => p.slug === slug)
  if (!def) {
    console.error(`No seed definition for "${slug}"`)
    process.exit(1)
  }
  const content = JSON.stringify(richTextFromBlocks(def.blocks))
  out.push(
    `UPDATE public.pages SET
  title = ${dq(def.title)},
  seo_title = ${def.seoTitle ? dq(def.seoTitle) : 'NULL'},
  seo_description = ${def.seoDescription ? dq(def.seoDescription) : 'NULL'},
  content = ${dq(content)}::jsonb,
  updated_at = now()
WHERE slug = ${dq(slug)};`,
  )
}
out.push('COMMIT;')
process.stdout.write(out.join('\n') + '\n')
