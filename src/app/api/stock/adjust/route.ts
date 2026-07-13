import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { adjustStock, hasMovement, type StockSource } from '@/lib/stock'

export const runtime = 'nodejs'

/**
 * Machine-to-machine stock adjustment endpoint. The always-on Etsy sync runner
 * (wherever it ends up hosted — Vercel Cron, a small worker, or SEOhost) posts
 * here to decrement the source of truth when a sale is detected on Etsy, and to
 * confirm pushes. Guarded by a shared secret, not a user session.
 *
 * Idempotency: when `externalRef` is supplied (e.g. an Etsy receipt id) the
 * adjustment is skipped if a movement with the same source+ref already exists,
 * so re-polling the same receipt never double-decrements.
 */

const SOURCES: StockSource[] = ['store-order', 'etsy-order', 'manual', 'restock', 'seed']

type Body = {
  sku?: string
  delta?: number
  source?: string
  reason?: string
  externalRef?: string
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return mismatch === 0
}

export async function POST(req: Request) {
  const secret = process.env.STOCK_SYNC_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Stock sync not configured' }, { status: 503 })
  }
  const provided = req.headers.get('x-stock-secret') ?? ''
  if (!timingSafeEqual(provided, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const sku = typeof body.sku === 'string' ? body.sku.trim() : ''
  const delta = Number(body.delta)
  const source = body.source as StockSource
  if (!sku || !Number.isFinite(delta) || delta === 0) {
    return NextResponse.json({ error: 'sku and non-zero numeric delta required' }, { status: 400 })
  }
  if (!SOURCES.includes(source)) {
    return NextResponse.json({ error: `source must be one of ${SOURCES.join(', ')}` }, { status: 400 })
  }

  const payload = await getPayloadClient()
  const externalRef = typeof body.externalRef === 'string' ? body.externalRef.trim() : undefined

  if (externalRef && (await hasMovement(payload, source, externalRef))) {
    return NextResponse.json({ ok: true, skipped: 'duplicate', externalRef })
  }

  const result = await adjustStock(payload, {
    sku,
    delta,
    source,
    ...(body.reason ? { reason: String(body.reason) } : {}),
    ...(externalRef ? { externalRef } : {}),
  })

  return NextResponse.json({ ok: true, result })
}
