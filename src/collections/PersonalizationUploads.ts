import type { CollectionConfig } from 'payload'
import { makeR2UploadHooks } from '../lib/r2-upload-hooks'

/** R2 storage prefix — must match the prefix configured in `payload.config.ts` s3Storage. */
export const PERSONALIZATION_UPLOADS_PREFIX = 'personalization-uploads'

/**
 * Customer-uploaded files for personalization (engraving artwork: PNG/JPEG/SVG/PDF).
 *
 * Kept separate from the curated `media` library so customer uploads don't clutter it,
 * can carry different access rules, and orphaned files (uploads that never made it into a
 * paid order) are easy to prune later (Phase 4).
 *
 * Access (security-critical): `create` is NOT public. Customer uploads only ever happen
 * through the dedicated server endpoint (Phase 3), which validates mime/size/content and
 * sanitizes, then writes via the Local API with `overrideAccess: true`. Leaving the
 * collection's own `create` open would let anyone `POST /api/personalization-uploads`
 * directly and bypass that validation — so it's gated to authenticated users here.
 * `read` is public (R2 keys are unguessable; the owner's order email links to the file),
 * mutation/delete is admin-only.
 *
 * Note: SVGs are stored and served as downloads only — never rendered inline in a context
 * where another user's browser would execute them. Sanitize before any preview (Phase 3/4).
 */
export const PersonalizationUploads: CollectionConfig = {
  slug: 'personalization-uploads',
  labels: {
    singular: 'Customer Uploaded File',
    plural: 'Customer Uploaded Files',
  },
  access: {
    read: () => true,
    // No one creates uploads by hand — not the public (security), and not even an admin
    // through the panel. Manual creation only leads to a dead-end "upload a file" screen
    // that has no purpose here. Records are created exclusively by the Phase 3 upload
    // endpoint when a customer uploads on a product page; it writes via the Local API,
    // which bypasses this access check (`overrideAccess`). Returning false here removes
    // the misleading "Create New" button + dropzone, so the panel is browse/download/delete.
    create: () => false,
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'originalName', 'relatedProduct', 'createdAt'],
    description:
      'Inbox for files customers upload on product pages. Entries appear here automatically — open one to download the artwork (e.g. to send for engraving). You do not create entries here by hand. To define a NEW personalization (engraving, file upload, color, etc.), use "Personalization Options" instead, then pin it on a product.',
  },
  upload: true,
  fields: [
    {
      name: 'originalName',
      type: 'text',
      admin: {
        description: 'Original filename as uploaded by the customer',
      },
    },
    {
      name: 'relatedProduct',
      type: 'relationship',
      relationTo: 'products',
      admin: {
        description: 'Product this upload was attached to (best-effort, for context)',
      },
    },
    {
      name: 'checksum',
      type: 'text',
      index: true,
      admin: {
        readOnly: true,
        description: 'SHA-256 of the stored bytes — set by the upload endpoint for integrity, dedup, and abuse fingerprinting',
      },
    },
    {
      name: 'sanitized',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        readOnly: true,
        description: 'Whether the stored file passed server-side sanitization (e.g. SVG script/handler stripping)',
      },
    },
    {
      name: 'scanStatus',
      type: 'select',
      defaultValue: 'skipped',
      options: [
        { label: 'Skipped (no scanner)', value: 'skipped' },
        { label: 'Pending', value: 'pending' },
        { label: 'Clean', value: 'clean' },
        { label: 'Flagged', value: 'flagged' },
      ],
      admin: {
        readOnly: true,
        description: 'Malware-scan result. Reserved — no scanner is wired up yet (defaults to "skipped").',
      },
    },
  ],
  // `attachment` so customer uploads always download instead of rendering inline — an
  // uploaded SVG/HTML can't run as stored-XSS. Paired with the separate R2 origin.
  hooks: makeR2UploadHooks(PERSONALIZATION_UPLOADS_PREFIX, { contentDisposition: 'attachment' }),
  timestamps: true,
}
