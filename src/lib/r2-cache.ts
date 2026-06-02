import { CopyObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'

export const CACHE_CONTROL = 'public, max-age=31536000, immutable'

let cachedClient: S3Client | null = null

export function getR2Client(): S3Client {
  if (cachedClient) return cachedClient
  cachedClient = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true,
  })
  return cachedClient
}

/**
 * Rewrite an R2 object's response metadata in place (server-side copy onto itself).
 * `cacheControl` defaults to the immutable long-cache value; pass `contentDisposition`
 * (e.g. `attachment`) to force browsers to download rather than render the object —
 * the key defense for customer-uploaded files (an SVG served `attachment` can't execute).
 */
export async function setObjectHeaders(
  key: string,
  opts: { cacheControl?: string; contentDisposition?: string } = {},
): Promise<void> {
  const bucket = process.env.R2_BUCKET
  if (!bucket) throw new Error('R2_BUCKET not set')
  const client = getR2Client()
  const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
  await client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      Key: key,
      CopySource: `${bucket}/${encodeURIComponent(key)}`,
      MetadataDirective: 'REPLACE',
      CacheControl: opts.cacheControl ?? CACHE_CONTROL,
      ...(opts.contentDisposition ? { ContentDisposition: opts.contentDisposition } : {}),
      ContentType: head.ContentType,
      Metadata: head.Metadata,
    }),
  )
}

export async function setCacheControlOnObject(key: string): Promise<void> {
  await setObjectHeaders(key)
}
