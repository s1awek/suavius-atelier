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

const cormorantCache = new Map<400 | 600, ArrayBuffer>()

async function fetchCormorant(weight: 400 | 600): Promise<ArrayBuffer> {
  const cached = cormorantCache.get(weight)
  if (cached) return cached
  const cssUrl = `https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@${weight}&display=swap`
  const css = await fetch(cssUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  }).then((r) => r.text())
  const match = css.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+\.(?:ttf|woff2?))\)/)
  if (!match) throw new Error('Could not extract Cormorant font URL from Google CSS')
  const fontBuf = await fetch(match[1]).then((r) => r.arrayBuffer())
  cormorantCache.set(weight, fontBuf)
  return fontBuf
}

export async function getCormorantFonts(): Promise<
  Array<{ name: string; data: ArrayBuffer; weight: 400 | 600; style: 'normal' }>
> {
  const [r, b] = await Promise.all([fetchCormorant(400), fetchCormorant(600)])
  return [
    { name: 'Cormorant', data: r, weight: 400, style: 'normal' },
    { name: 'Cormorant', data: b, weight: 600, style: 'normal' },
  ]
}
