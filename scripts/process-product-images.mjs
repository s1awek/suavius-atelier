// Convert the owner's curated product photos into SEO-named WebP files + a manifest.
//
// Source: /home/op/Pictures/100CANON/processed/products/<NN-product>/final/
//   - front*.png  = PCB front face (transparent cutout, 2000x2000)
//   - IMG_*.png   = PCB reverse / wood view (transparent cutout)
//   - Gemini*/ChatGPT* .jpg = styled lifestyle shots
// Output: <NN-product>/web/<slug>-<role>-<n>.webp  +  web/manifest.json
//   Gallery order (encoded in manifest): front -> styled -> reverse (wood: view -> styled).
//
// Run: node scripts/process-product-images.mjs

import { readdir, mkdir, rm, writeFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import sharp from 'sharp'

const ROOT = '/home/op/Pictures/100CANON/processed/products'
const GALLERY_BG = '#e8e0d0' // bg-warm-mid — the colour the cutouts sit on, so we defringe toward it

/** Per-folder config: slug + short name + alt-text descriptors. */
const PRODUCTS = [
  {
    folder: '01-tennis-court',
    slug: 'tennis-court-pcb-coaster',
    shortName: 'tennis court',
    design: 'aerial tennis court',
    colours: 'clay red and white',
    kind: 'pcb',
  },
  {
    folder: '02-marble-gold',
    slug: 'black-marble-gold-pcb-coaster',
    shortName: 'black marble and gold',
    design: 'black marble with gold veins',
    colours: 'black and gold',
    kind: 'pcb',
  },
  {
    folder: '03-minimal-gold-rings',
    slug: 'gold-rings-pcb-coaster',
    shortName: 'gold rings',
    design: 'concentric gold rings',
    colours: 'black and gold',
    kind: 'pcb',
  },
  {
    folder: '04-autumn-forest',
    slug: 'autumn-forest-pcb-coaster',
    shortName: 'autumn forest',
    design: 'aerial autumn forest mosaic',
    colours: 'amber, rust and green',
    kind: 'pcb',
  },
  {
    folder: '05-topographic-teal-orange',
    slug: 'topographic-pcb-coaster',
    shortName: 'topographic',
    design: 'topographic contour lines',
    colours: 'teal and orange',
    kind: 'pcb',
  },
  {
    folder: '06-wood',
    slug: 'ash-wood-coaster',
    shortName: 'ash wood',
    design: 'round ash wood disc',
    colours: 'natural ash',
    kind: 'wood',
  },
]

// Trailing-number aware sort: "front 2" < "front 10", "IMG_9801" < "IMG_9825".
function naturalSort(a, b) {
  const na = (a.match(/(\d+)(?=\D*$)/) || [])[1]
  const nb = (b.match(/(\d+)(?=\D*$)/) || [])[1]
  if (na != null && nb != null && na !== nb) return Number(na) - Number(nb)
  return a.localeCompare(b)
}

function classify(file) {
  if (/^front/i.test(file)) return 'front'
  if (/gemini|chatgpt/i.test(file)) return 'styled'
  if (/^img_/i.test(file)) return 'reverse' // PCB reverse; wood remaps below
  return 'other'
}

function altFor(p, role, n) {
  switch (role) {
    case 'front':
      return `${p.design} PCB coaster in ${p.colours}, front view with gold ENIG finish - Suavius Atelier`
    case 'reverse':
      return `Reverse of the ${p.shortName} PCB coaster - gilded pattern with the Suavius Atelier monogram`
    case 'view':
      return `Round ash wood coaster, oiled and waxed - view ${n}`
    case 'styled':
      return p.kind === 'wood'
        ? `Ash wood coaster styled on a desk beside a cup`
        : `${p.shortName} PCB coaster styled on a desk beside a cup`
    default:
      return `${p.shortName} coaster - Suavius Atelier`
  }
}

async function run() {
  for (const p of PRODUCTS) {
    const finalDir = join(ROOT, p.folder, 'final')
    const webDir = join(ROOT, p.folder, 'web')
    const all = (await readdir(finalDir)).filter((f) => /\.(png|jpe?g)$/i.test(f))

    const buckets = { front: [], reverse: [], styled: [] }
    for (const f of all) buckets[classify(f)]?.push(f)
    for (const k of Object.keys(buckets)) buckets[k].sort(naturalSort)

    // Order: PCB front -> styled -> reverse ; wood view(=reverse bucket) -> styled.
    let ordered
    if (p.kind === 'wood') {
      ordered = [
        ...buckets.reverse.map((file) => ({ file, role: 'view' })),
        ...buckets.styled.map((file) => ({ file, role: 'styled' })),
      ]
    } else {
      ordered = [
        ...buckets.front.map((file) => ({ file, role: 'front' })),
        ...buckets.styled.map((file) => ({ file, role: 'styled' })),
        ...buckets.reverse.map((file) => ({ file, role: 'reverse' })),
      ]
    }

    await rm(webDir, { recursive: true, force: true })
    await mkdir(webDir, { recursive: true })

    const counters = {}
    const manifest = []
    for (const { file, role } of ordered) {
      counters[role] = (counters[role] ?? 0) + 1
      const n = counters[role]
      const outName = `${p.slug}-${role}-${n}.webp`
      const srcPath = join(finalDir, file)
      const outPath = join(webDir, outName)
      const isCutout = /\.png$/i.test(file)

      if (isCutout) {
        // Transparent cutouts carry a baked dark drop-shadow + a dark anti-aliased fringe that
        // read as a black halo/outline on the site's light canvas. "erode3_defringe" recipe
        // (user-approved 2026-06-25), in 5 steps because ImageMagick can't defringe-toward-a-colour
        // in one op:
        //   1. alpha-level 40-75% — clip the low-alpha shadow.
        //   2/3. bleed the edge COLOUR toward the warm gallery bg (dark fringe -> light) by
        //        flattening onto GALLERY_BG and re-attaching the original alpha.
        //   4. erode the matte ~3px to cut the remaining dark outline entirely.
        const tmp = (s) => join(webDir, `_tmp_${role}_${n}_${s}.png`)
        const dShadow = tmp('d')
        const alpha = tmp('a')
        const flat = tmp('f')
        const defr = tmp('df')
        execFileSync('convert', [srcPath, '-channel', 'A', '-level', '40%,75%', '+channel', dShadow])
        execFileSync('convert', [dShadow, '-alpha', 'extract', alpha])
        execFileSync('convert', [dShadow, '-background', GALLERY_BG, '-alpha', 'remove', '-alpha', 'off', flat])
        execFileSync('convert', [flat, alpha, '-alpha', 'off', '-compose', 'CopyOpacity', '-composite', defr])
        execFileSync('convert', [
          defr,
          '-channel', 'A', '-morphology', 'Erode', 'Disk:3', '+channel',
          '-quality', '82', '-define', 'webp:method=6',
          outPath,
        ])
        for (const f of [dShadow, alpha, flat, defr]) await rm(f, { force: true })
      } else {
        // Lifestyle JPGs have no alpha; straight WebP encode.
        await sharp(srcPath).webp({ quality: 82, effort: 6 }).toFile(outPath)
      }

      const { size } = await stat(outPath)
      manifest.push({ file: outName, role, alt: altFor(p, role, n) })
      console.log(
        `  ${p.folder}: ${file} -> ${outName} (${(size / 1024).toFixed(0)}kB${isCutout ? ', alpha, deshadowed' : ''})`,
      )
    }

    await writeFile(join(webDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
    console.log(`  ${p.slug}: ${manifest.length} images -> web/manifest.json\n`)
  }
  console.log('Done.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
