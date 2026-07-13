import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config.js'
import { adjustStock } from '../lib/stock.js'

/**
 * One-off: set the launch starting stock per the approved plan
 * (tennis 10, the other four PCB coasters 5 each, wood 10). The seed left every
 * variant at 25. Idempotent — it computes the delta to the target and applies
 * it through adjustStock, so re-running when already correct is a no-op.
 *
 * Run against dev now; re-run against prod at catalog go-live:
 *   npx tsx src/seed/correct-starting-stock.ts
 *   DATABASE_URL="<prod>" NODE_ENV=production npx tsx src/seed/correct-starting-stock.ts
 */

const TARGETS: Record<string, number> = {
  'tennis-court-pcb-coaster-standard': 10,
  'black-marble-gold-pcb-coaster-standard': 5,
  'gold-rings-pcb-coaster-standard': 5,
  'autumn-forest-pcb-coaster-standard': 5,
  'topographic-pcb-coaster-standard': 5,
  'ash-wood-coaster-standard': 10,
}

async function main() {
  const payload = await getPayload({ config: await config })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (payload.db as any).drizzle
  const { sql } = await import('drizzle-orm')

  for (const [sku, target] of Object.entries(TARGETS)) {
    const cur = await db.execute(sql`SELECT stock FROM products_variants WHERE sku = ${sku}`)
    if (cur.rowCount === 0) {
      console.warn(`  ! no variant row for ${sku} — skipping`)
      continue
    }
    const current = Number(cur.rows[0].stock)
    const delta = target - current
    if (delta === 0) {
      console.log(`  = ${sku} already ${target}`)
      continue
    }
    const res = await adjustStock(payload, {
      sku,
      delta,
      source: 'manual',
      reason: 'starting stock correction',
    })
    console.log(`  ${delta > 0 ? '+' : ''}${delta} ${sku}: ${current} -> ${res.newStock}`)
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
