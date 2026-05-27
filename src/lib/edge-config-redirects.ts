import type { Payload } from 'payload'

/**
 * Pushes the full set of redirects into Vercel Edge Config under a single key, so the
 * middleware can resolve them at the edge with zero per-request DB cost.
 *
 * Reads happen in middleware via `@vercel/edge-config` (the `EDGE_CONFIG` connection
 * string, auto-injected when the store is connected to the project). Writes go through
 * the Vercel REST API and need `EDGE_CONFIG_ID` + `VERCEL_API_TOKEN` (+ `VERCEL_TEAM_ID`
 * for team-scoped projects). When those aren't set this is a no-op, so the app keeps
 * working (the in-page `applyRedirect` fallback still handles redirects).
 */

export const EDGE_CONFIG_REDIRECTS_KEY = 'redirects'

export type RedirectEntry = { to: string; permanent: boolean }
export type RedirectMap = Record<string, RedirectEntry>

export async function syncRedirectsToEdgeConfig(payload: Payload): Promise<void> {
  const edgeConfigId = process.env.EDGE_CONFIG_ID
  const token = process.env.VERCEL_API_TOKEN
  const teamId = process.env.VERCEL_TEAM_ID

  if (!edgeConfigId || !token) {
    payload.logger.info('[redirects] Edge Config write skipped (EDGE_CONFIG_ID / VERCEL_API_TOKEN not set)')
    return
  }

  const { docs } = await payload.find({
    collection: 'redirects',
    limit: 5000,
    depth: 0,
    overrideAccess: true,
  })

  const map: RedirectMap = {}
  for (const r of docs) {
    if (typeof r.from === 'string' && typeof r.to === 'string') {
      map[r.from] = { to: r.to, permanent: r.permanent !== false }
    }
  }

  const url = new URL(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`)
  if (teamId) url.searchParams.set('teamId', teamId)

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ operation: 'upsert', key: EDGE_CONFIG_REDIRECTS_KEY, value: map }],
      }),
    })
    if (!res.ok) {
      payload.logger.error(`[redirects] Edge Config sync failed: ${res.status} ${await res.text()}`)
    }
  } catch (err) {
    payload.logger.error(`[redirects] Edge Config sync error: ${String(err)}`)
  }
}
