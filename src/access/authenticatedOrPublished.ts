import type { Access } from 'payload'

/**
 * Public read gate for draft-enabled collections.
 *
 * - Logged-in admin users (or Local API calls with `overrideAccess`) see everything,
 *   including unpublished drafts — that's what powers the panel and draft preview.
 * - Everyone else (the public site, served via the Local API with no user) only ever
 *   sees the published version. This is the single source of truth that keeps drafts
 *   off the live store; pages don't need to repeat a `_status` filter.
 */
export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}
