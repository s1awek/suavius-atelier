import { sql } from 'drizzle-orm'
import type { Payload } from 'payload'

/**
 * Where a stock movement originated. Used for the audit log and to let channels
 * react (e.g. a store sale must push the new quantity to Etsy; an Etsy sale must
 * not be pushed back to Etsy).
 */
export type StockSource = 'store-order' | 'etsy-order' | 'manual' | 'restock' | 'seed'

export type StockAdjustment = {
  /** Variant SKU to adjust (products_variants.sku). */
  sku: string
  /** Signed change: negative for sales/decrements, positive for restocks. */
  delta: number
  /** Origin of the change, for the audit log. */
  source: StockSource
  /** Free-text context (order id, receipt id, ...) for the log line. */
  reason?: string
  /**
   * Idempotency key of the originating event (Stripe order id, Etsy receipt id).
   * Recorded on the movement so a retry/re-poll of the same event can be skipped
   * with {@link hasMovement}.
   */
  externalRef?: string
}

export type StockAdjustResult = {
  sku: string
  requestedDelta: number
  /** True when the row existed and was updated. */
  applied: boolean
  /** Stock after the change, or null when no matching variant row was found. */
  newStock: number | null
  /** True when a decrement hit insufficient stock and was clamped to 0 (oversold). */
  clamped: boolean
}

type DrizzleResult = { rowCount: number; rows: Array<{ stock: string | number }> }

function getDrizzle(payload: Payload) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (payload.db as any).drizzle
}

/**
 * Atomically adjust one variant's stock in the source of truth
 * (products_variants.stock). This is the single entry point for every stock
 * movement — Stripe webhook, Etsy sync, and manual corrections all go through
 * here so the running total stays correct and each change is logged with its
 * origin.
 *
 * Concurrency: the UPDATE locks the row, so parallel calls serialize. A
 * decrement only succeeds when there is enough stock; otherwise it clamps to 0
 * and reports `clamped` so the caller can surface the multichannel oversell
 * (made-to-order absorbs it as a longer processing time).
 */
export async function adjustStock(
  payload: Payload,
  { sku, delta, source, reason, externalRef }: StockAdjustment,
): Promise<StockAdjustResult> {
  const base: StockAdjustResult = {
    sku,
    requestedDelta: delta,
    applied: false,
    newStock: null,
    clamped: false,
  }

  if (!sku || !Number.isFinite(delta) || delta === 0) return base

  const db = getDrizzle(payload)
  const suffix = `source=${source}${reason ? `, ${reason}` : ''}`

  // Log the applied movement for reconciliation + idempotency. Best-effort: a
  // failed log write must not roll back a stock change that already committed.
  const record = async (result: StockAdjustResult) => {
    if (!result.applied) return result
    try {
      await payload.create({
        collection: 'stock-movements',
        data: {
          sku,
          delta,
          newStock: result.newStock,
          source,
          clamped: result.clamped,
          ...(reason ? { reason } : {}),
          ...(externalRef ? { externalRef } : {}),
        },
      })
    } catch (err) {
      payload.logger.error(
        `[stock] movement log write failed for sku ${sku} (${suffix}): ${err instanceof Error ? err.message : err}`,
      )
    }
    return result
  }

  try {
    if (delta > 0) {
      // Restock / positive correction — unconditional add.
      const res: DrizzleResult = await db.execute(sql`
        UPDATE products_variants
        SET stock = stock + ${delta}::numeric
        WHERE sku = ${sku}
        RETURNING stock
      `)
      if (res.rowCount === 0) {
        payload.logger.warn(`[stock] no variant row for sku ${sku} (${suffix})`)
        return base
      }
      const newStock = Number(res.rows[0].stock)
      payload.logger.info(`[stock] ${sku} +${delta} -> ${newStock} (${suffix})`)
      return record({ ...base, applied: true, newStock })
    }

    // delta < 0 — decrement with an atomic sufficiency guard.
    const qty = -delta
    const strict: DrizzleResult = await db.execute(sql`
      UPDATE products_variants
      SET stock = stock - ${qty}::numeric
      WHERE sku = ${sku} AND stock >= ${qty}::numeric
      RETURNING stock
    `)
    if (strict.rowCount > 0) {
      const newStock = Number(strict.rows[0].stock)
      payload.logger.info(`[stock] ${sku} -${qty} -> ${newStock} (${suffix})`)
      return record({ ...base, applied: true, newStock })
    }

    // Not enough stock (or no row). Clamp to 0 if a row exists.
    const clamp: DrizzleResult = await db.execute(sql`
      UPDATE products_variants
      SET stock = 0
      WHERE sku = ${sku} AND stock > 0
      RETURNING stock
    `)
    if (clamp.rowCount > 0) {
      payload.logger.warn(`[stock] oversold ${sku}: asked -${qty}, clamped to 0 (${suffix})`)
      return record({ ...base, applied: true, newStock: 0, clamped: true })
    }

    payload.logger.warn(`[stock] decrement no-op for sku ${sku}: no row or already zero (${suffix})`)
    return base
  } catch (err) {
    payload.logger.error(
      `[stock] adjust failed for sku ${sku} (${suffix}): ${err instanceof Error ? err.message : err}`,
    )
    throw err
  }
}

/**
 * True when a movement with this `externalRef` from this `source` already
 * exists. The Etsy receipts poller calls this before decrementing so re-polling
 * the same receipt never double-counts. (Stripe orders are already deduped
 * upstream by the paid-claim, so the webhook path does not need this.)
 */
export async function hasMovement(
  payload: Payload,
  source: StockSource,
  externalRef: string,
): Promise<boolean> {
  if (!externalRef) return false
  const existing = await payload.find({
    collection: 'stock-movements',
    where: {
      and: [{ source: { equals: source } }, { externalRef: { equals: externalRef } }],
    },
    limit: 1,
    depth: 0,
  })
  return existing.totalDocs > 0
}

/**
 * Apply a batch of adjustments sequentially (one locked UPDATE at a time), all
 * sharing the same source/reason. Returns per-line results in input order.
 */
export async function adjustStockBatch(
  payload: Payload,
  lines: Array<{ sku?: string | null; delta: number }>,
  meta: { source: StockSource; reason?: string },
): Promise<StockAdjustResult[]> {
  const results: StockAdjustResult[] = []
  for (const line of lines) {
    if (!line.sku || !Number.isFinite(line.delta) || line.delta === 0) continue
    results.push(
      await adjustStock(payload, {
        sku: line.sku,
        delta: line.delta,
        source: meta.source,
        reason: meta.reason,
      }),
    )
  }
  return results
}
