import 'dotenv/config'
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
import { setCacheControlOnObject } from '../src/lib/r2-cache.js'

async function main(): Promise<void> {
  const bucket = process.env.R2_BUCKET
  if (!bucket) throw new Error('R2_BUCKET not set')

  const client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true,
  })

  let continuationToken: string | undefined
  let total = 0
  let failed = 0

  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
      }),
    )
    const objects = res.Contents ?? []
    for (const obj of objects) {
      if (!obj.Key) continue
      try {
        await setCacheControlOnObject(obj.Key)
        total += 1
        if (total % 25 === 0) console.log(`  ...${total} done`)
      } catch (err) {
        failed += 1
        console.warn(`  ! ${obj.Key}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (continuationToken)

  console.log(`\nDone. Updated ${total} objects, ${failed} failed.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
