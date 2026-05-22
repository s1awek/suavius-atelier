// Generates SVG logos (text-as-path) from Cormorant Garamond.
// Run: node scripts/generate-logo.mjs
// Output: public/brand/wordmark.svg, public/brand/mark.svg
//
// Also writes PNG variants used for JSON-LD Organization.logo + favicon.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import opentype from 'opentype.js'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const fontPath = process.env.CORMORANT_TTF || '/tmp/cormorant-medium.ttf'

const FONT_URL =
  'https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/CormorantGaramond%5Bwght%5D.ttf'

if (!existsSync(fontPath)) {
  console.log(`Font not found at ${fontPath}, downloading from Google Fonts...`)
  const res = await fetch(FONT_URL)
  if (!res.ok) {
    console.error(`Failed to download font: ${res.status}`)
    process.exit(1)
  }
  const buf = Buffer.from(await res.arrayBuffer())
  writeFileSync(fontPath, buf)
  console.log(`Saved ${buf.length} bytes to ${fontPath}`)
}

const font = opentype.parse(readFileSync(fontPath).buffer)
const COPPER = '#b87333'

function letterSpacedPath(text, fontSize, tracking) {
  // Render each glyph individually with extra advance for letter-spacing.
  let x = 0
  const subPaths = []
  for (const char of text) {
    const glyph = font.charToGlyph(char)
    const p = glyph.getPath(x, 0, fontSize)
    subPaths.push(p.toPathData(3))
    const advance = (glyph.advanceWidth / font.unitsPerEm) * fontSize
    x += advance + tracking
  }
  const totalWidth = x - tracking
  return { d: subPaths.join(' '), width: totalWidth }
}

// === WORDMARK: "SUAVIUS  ATELIER" ===
{
  const fontSize = 120
  const tracking = fontSize * 0.18 // wide letter-spacing
  const text = 'SUAVIUS  ATELIER'
  const { d, width } = letterSpacedPath(text, fontSize, tracking)

  // Bounds from font ascent/descent
  const ascent = (font.ascender / font.unitsPerEm) * fontSize
  const descent = (font.descender / font.unitsPerEm) * fontSize
  const padX = 20
  const padY = 16
  const viewW = Math.ceil(width + padX * 2)
  const viewH = Math.ceil(ascent - descent + padY * 2)

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewW} ${viewH}" width="${viewW}" height="${viewH}" role="img" aria-label="Suavius Atelier">
  <title>Suavius Atelier</title>
  <g transform="translate(${padX}, ${ascent + padY})" fill="${COPPER}">
    <path d="${d}"/>
  </g>
</svg>
`
  writeFileSync(path.join(projectRoot, 'public/brand/wordmark.svg'), svg)
  console.log(`wordmark.svg: ${viewW}x${viewH}`)
}

// === MARK: "SA" monogram, square ===
{
  const fontSize = 360
  const tracking = fontSize * 0.02
  const text = 'SA'
  const { d, width } = letterSpacedPath(text, fontSize, tracking)
  const ascent = (font.ascender / font.unitsPerEm) * fontSize
  const descent = (font.descender / font.unitsPerEm) * fontSize
  const glyphH = ascent - descent

  // Square canvas with the monogram centered.
  const canvas = 512
  const tx = (canvas - width) / 2
  const ty = (canvas - glyphH) / 2 + ascent

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas} ${canvas}" width="${canvas}" height="${canvas}" role="img" aria-label="Suavius Atelier">
  <title>Suavius Atelier</title>
  <rect width="${canvas}" height="${canvas}" fill="#f5f0e8"/>
  <g transform="translate(${tx}, ${ty})" fill="${COPPER}">
    <path d="${d}"/>
  </g>
</svg>
`
  writeFileSync(path.join(projectRoot, 'public/brand/mark.svg'), svg)
  console.log(`mark.svg: ${canvas}x${canvas}`)

  // PNG variants for favicon + JSON-LD logo (Google prefers raster).
  const sizes = [
    { name: 'mark-512.png', size: 512 },
    { name: 'mark-192.png', size: 192 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-32.png', size: 32 },
  ]
  for (const { name, size } of sizes) {
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(path.join(projectRoot, 'public/brand', name))
    console.log(`  ${name}`)
  }
}

console.log('Done.')
