// Force production mode BEFORE importing Payload (dev mode tries to drizzle-push the
// schema, which is destructive against a real DB and poisons the Neon pooler).
Object.assign(process.env, { NODE_ENV: 'production' })

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import { syncRedirectsToEdgeConfig } from '../src/lib/edge-config-redirects.js'

/**
 * Pushes all redirect rows from the DB into Vercel Edge Config. Run once after first
 * connecting an Edge Config store (the hooks keep it in sync afterwards), or any time
 * the map and the store drift.
 *
 * Needs EDGE_CONFIG_ID + VERCEL_API_TOKEN (+ VERCEL_TEAM_ID) in the environment, and
 * DATABASE_URL pointing at the DB whose redirects you want to publish:
 *   pnpm exec tsx scripts/sync-redirects-edge-config.ts                      # current .env DB
 *   DATABASE_URL="<prod-url>" pnpm exec tsx scripts/sync-redirects-edge-config.ts  # prod
 */
async function run() {
  const resolved = await config
  const payload = await getPayload({ config: resolved })
  const dbHost = (process.env.DATABASE_URL ?? '').replace(/.*@/, '').replace(/\/.*$/, '')
  payload.logger.info(`Syncing redirects -> Edge Config from DB host: ${dbHost || '(unknown)'}`)
  await syncRedirectsToEdgeConfig(payload)
  payload.logger.info('Done.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
