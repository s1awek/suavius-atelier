import type { CollectionAfterChangeHook } from 'payload'
import { sendStockRestockNotification } from '@/lib/email'
import { isPublished } from './published'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://suaviusatelier.com'

type Variant = {
  name: string
  sku: string
  stock: number
}

function getVariants(doc: unknown): Variant[] {
  const variants = (doc as { variants?: unknown }).variants
  if (!Array.isArray(variants)) return []
  return variants
    .filter((v): v is Record<string, unknown> => v !== null && typeof v === 'object')
    .map((v) => ({
      name: typeof v.name === 'string' ? v.name : '',
      sku: typeof v.sku === 'string' ? v.sku : '',
      stock: typeof v.stock === 'number' ? v.stock : 0,
    }))
}

export const notifyStockRestock: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  if (operation !== 'update' || !previousDoc) return
  // Don't email customers from a draft save — only when the restock is published live.
  if (!isPublished(doc)) return

  const prevVariants = getVariants(previousDoc)
  const nextVariants = getVariants(doc)

  // Notify on any stock INCREASE to a positive value — not only the 0 -> positive transition.
  // This covers both genuinely out-of-stock subscribers and "stock limit reached" subscribers
  // (who joined the waitlist while holding all current units in their cart and want to know
  // when MORE are made). Only people who explicitly joined the waitlist are ever emailed, and
  // each is marked notified after one send, so a stock bump never spams.
  const restocked: Variant[] = []
  for (const next of nextVariants) {
    if (next.stock <= 0) continue
    const prev = prevVariants.find((p) => p.sku === next.sku)
    const prevStock = prev?.stock ?? 0
    if (next.stock <= prevStock) continue
    restocked.push(next)
  }

  if (restocked.length === 0) return

  const productTitle = (doc as { title?: string }).title ?? 'a piece'
  const productSlug = (doc as { slug?: string }).slug ?? ''
  const productUrl = productSlug ? `${SITE_URL}/products/${productSlug}` : SITE_URL

  for (const variant of restocked) {
    try {
      const alerts = await req.payload.find({
        collection: 'stock-alerts',
        where: {
          and: [
            { variantSku: { equals: variant.sku } },
            { notified: { equals: false } },
          ],
        },
        limit: 200,
      })

      if (alerts.docs.length === 0) continue

      req.payload.logger.info(
        `[stock-restock] notifying ${alerts.docs.length} subscribers for ${productTitle} / ${variant.sku}`,
      )

      for (const alert of alerts.docs) {
        try {
          await sendStockRestockNotification({
            email: alert.email,
            productTitle,
            variantName: variant.name,
            productUrl,
          })
          await req.payload.update({
            collection: 'stock-alerts',
            id: alert.id,
            data: { notified: true, notifiedAt: new Date().toISOString() },
          })
        } catch (err) {
          req.payload.logger.error(
            `[stock-restock] failed for ${alert.email}: ${err instanceof Error ? err.message : err}`,
          )
        }
      }
    } catch (err) {
      req.payload.logger.error(
        `[stock-restock] query failed for sku ${variant.sku}: ${err instanceof Error ? err.message : err}`,
      )
    }
  }
}
