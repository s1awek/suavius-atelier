/**
 * On-demand revalidation helpers for Payload hooks.
 *
 * Payload mutations that come through the admin / API run inside a Next request
 * context, where `revalidatePath` invalidates the Full Route Cache so the next
 * visitor sees fresh content immediately (no waiting for the time-based ISR window).
 *
 * `next/cache` is imported lazily and every call is guarded, so the same hooks are
 * safe to run from CLI/seed scripts (outside Next) — there they simply no-op.
 */

/** Revalidate a set of concrete frontend paths (deduped, falsy entries dropped). */
export async function revalidatePaths(paths: Array<string | null | undefined>): Promise<void> {
  const unique = Array.from(new Set(paths.filter((p): p is string => Boolean(p))))
  if (unique.length === 0) return
  try {
    const { revalidatePath } = await import('next/cache')
    for (const path of unique) {
      try {
        revalidatePath(path)
      } catch {
        // outside a request context (CLI/seed) — nothing to revalidate
      }
    }
  } catch {
    // next/cache unavailable in this runtime — skip
  }
}

/** Revalidate every route under the root layout (use for global/site-wide changes). */
export async function revalidateLayout(): Promise<void> {
  try {
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/', 'layout')
  } catch {
    // outside a request context, or next/cache unavailable — skip
  }
}
