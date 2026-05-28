/**
 * Draft-aware guard for afterChange hooks. With `versions.drafts` enabled, afterChange
 * fires on draft saves too — but redirects, public revalidation and restock emails must
 * only react to published content. A doc from a collection without drafts has no
 * `_status`, so it is always treated as published (hooks keep firing as before).
 */
export function isPublished(doc: unknown): boolean {
  const status = (doc as { _status?: unknown } | null | undefined)?._status
  return status === undefined || status === 'published'
}
