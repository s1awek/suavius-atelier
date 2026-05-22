import sharp from 'sharp'

export async function imageResponseToJpeg(
  imageResponse: Response,
  quality = 82,
): Promise<Response> {
  const png = Buffer.from(await imageResponse.arrayBuffer())
  const jpeg = await sharp(png).jpeg({ quality, mozjpeg: true }).toBuffer()
  return new Response(new Uint8Array(jpeg), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
