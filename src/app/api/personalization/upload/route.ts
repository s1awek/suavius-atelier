import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import type { PersonalizationOption, Product } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { enforceRatelimit, getClientIp, uploadRatelimit } from '@/lib/ratelimit'
import { HARD_MAX_BYTES, validateUpload } from '@/lib/upload-validation'

// Node runtime: needs Buffer + node:crypto + the Payload Local API (not edge-compatible).
export const runtime = 'nodejs'

/**
 * Customer personalization upload endpoint (Phase 3).
 *
 * The ONLY way a `personalization-uploads` record is created — the collection's own `create`
 * access is closed, so a direct `POST /api/personalization-uploads` is rejected. Here we
 * validate (rate limit, the option is really a file-type option pinned to the product,
 * content type by magic bytes, size, SVG sanitization) BEFORE writing via the Local API with
 * `overrideAccess: true`. The client gets back only `{ uploadId, url, filename }`, which it
 * stashes on the cart line; the checkout re-validates that the id exists.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req)
  const limit = await enforceRatelimit(uploadRatelimit, ip)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many uploads. Please try again in a moment.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(limit.retryAfter),
          'X-RateLimit-Reset': String(limit.reset),
        },
      },
    )
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid upload request' }, { status: 400 })
  }

  const file = form.get('file')
  const productId = Number(form.get('productId'))
  const optionId = Number(form.get('optionId'))

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (!Number.isInteger(productId) || !Number.isInteger(optionId)) {
    return NextResponse.json({ error: 'Missing productId or optionId' }, { status: 400 })
  }
  // Cheap upfront reject before buffering, using the declared size (re-checked on the buffer).
  if (file.size > HARD_MAX_BYTES) {
    return NextResponse.json({ error: 'File is too large.' }, { status: 413 })
  }

  const payload = await getPayloadClient()

  let product: Product | null
  try {
    product = await payload.findByID({ collection: 'products', id: productId, depth: 1 })
  } catch {
    product = null
  }
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // The option must be pinned to THIS product and be a file-upload option — otherwise the
  // upload has no legitimate purpose (anti-abuse: no uploading against arbitrary products).
  const pinned = (product.personalizations ?? []).find(
    (row) => typeof row.option === 'object' && row.option !== null && row.option.id === optionId,
  )
  const option =
    pinned && typeof pinned.option === 'object' ? (pinned.option as PersonalizationOption) : null
  if (!option || option.inputType !== 'file') {
    return NextResponse.json(
      { error: 'This product does not accept a file for that option.' },
      { status: 400 },
    )
  }

  const allowedTypes = option.fileConfig?.allowedTypes ?? ['image/png', 'image/jpeg', 'image/svg+xml', 'application/pdf']
  const maxSizeMB = typeof option.fileConfig?.maxSizeMB === 'number' ? option.fileConfig.maxSizeMB : 10
  const maxBytes = Math.min(maxSizeMB * 1024 * 1024, HARD_MAX_BYTES)

  const buf = Buffer.from(await file.arrayBuffer())
  const result = validateUpload(buf, allowedTypes, maxBytes)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const checksum = createHash('sha256').update(result.bytes).digest('hex')

  let upload
  try {
    upload = await payload.create({
      collection: 'personalization-uploads',
      overrideAccess: true,
      data: {
        originalName: file.name?.slice(0, 255) || result.filename,
        relatedProduct: product.id,
        checksum,
        sanitized: result.sanitized,
        scanStatus: 'skipped',
      },
      file: {
        data: result.bytes,
        mimetype: result.mime,
        name: result.filename,
        size: result.bytes.length,
      },
    })
  } catch (err) {
    console.error('[personalization/upload] failed to store upload', err)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({
    uploadId: upload.id,
    url: upload.url,
    filename: upload.filename,
    originalName: upload.originalName,
  })
}
