#!/usr/bin/env node
/**
 * Page inspector for local dev — screenshot + console + JS errors + failed network.
 *
 * Usage:
 *   node tools/inspect.mjs <path-or-url> [--w=1280] [--h=900] [--full] [--out=name] [--wait=ms]
 *
 * Examples:
 *   node tools/inspect.mjs /                       # home at 1280px
 *   node tools/inspect.mjs /products --w=800       # narrow viewport (header collision zone)
 *   node tools/inspect.mjs /collections --full     # full-page screenshot
 *   node tools/inspect.mjs https://example.com --out=remote
 *
 * Screenshots land in tools/live/ (gitignored). Console messages, page errors and
 * failed requests are printed to stdout so they can be read back without a browser.
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LIVE_DIR = join(__dirname, 'live')
const BASE = process.env.INSPECT_BASE_URL ?? 'http://localhost:3000'

function parseArgs(argv) {
  const opts = { width: 1280, height: 900, full: false, wait: 0, out: null }
  let target = '/'
  for (const arg of argv) {
    if (arg.startsWith('--w=')) opts.width = Number(arg.slice(4))
    else if (arg.startsWith('--h=')) opts.height = Number(arg.slice(4))
    else if (arg === '--full') opts.full = true
    else if (arg.startsWith('--out=')) opts.out = arg.slice(6)
    else if (arg.startsWith('--wait=')) opts.wait = Number(arg.slice(7))
    else if (!arg.startsWith('--')) target = arg
  }
  return { target, opts }
}

const { target, opts } = parseArgs(process.argv.slice(2))
const url = /^https?:\/\//.test(target) ? target : BASE + (target.startsWith('/') ? target : '/' + target)

const slug =
  opts.out ??
  (target.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home')
const shotPath = join(LIVE_DIR, `${slug}-${opts.width}w.png`)

mkdirSync(LIVE_DIR, { recursive: true })

const consoleMsgs = []
const pageErrors = []
const failedRequests = []

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: opts.width, height: opts.height } })

page.on('console', (msg) => {
  const type = msg.type()
  if (type === 'error' || type === 'warning' || type === 'log') {
    consoleMsgs.push({ type, text: msg.text(), location: msg.location() })
  }
})
page.on('pageerror', (err) => pageErrors.push(err.message))
page.on('requestfailed', (req) => {
  failedRequests.push({ url: req.url(), error: req.failure()?.errorText ?? 'failed' })
})
page.on('response', (res) => {
  const status = res.status()
  if (status >= 400) failedRequests.push({ url: res.url(), status })
})

let navError = null
try {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
  if (opts.wait) await page.waitForTimeout(opts.wait)
  await page.screenshot({ path: shotPath, fullPage: opts.full })
} catch (err) {
  navError = err.message
}

await browser.close()

// ---- report ----
const line = '─'.repeat(60)
console.log(line)
console.log(`URL:        ${url}`)
console.log(`viewport:   ${opts.width}×${opts.height}${opts.full ? ' (full-page shot)' : ''}`)
if (!navError) console.log(`screenshot: ${shotPath}`)
console.log(line)

if (navError) {
  console.log(`\n❌ NAVIGATION FAILED: ${navError}`)
  if (navError.includes('ECONNREFUSED') || navError.includes('connect')) {
    console.log('   (is the dev server running?  pnpm dev)')
  }
  process.exit(1)
}

const errs = consoleMsgs.filter((m) => m.type === 'error')
const warns = consoleMsgs.filter((m) => m.type === 'warning')

console.log(`\nconsole: ${errs.length} error(s), ${warns.length} warning(s)`)
console.log(`pageerror (uncaught JS): ${pageErrors.length}`)
console.log(`failed/4xx-5xx requests: ${failedRequests.length}`)

if (pageErrors.length) {
  console.log('\n── UNCAUGHT JS ERRORS ──')
  pageErrors.forEach((m) => console.log(`  ✖ ${m}`))
}
if (errs.length) {
  console.log('\n── CONSOLE ERRORS ──')
  errs.forEach((m) => {
    const loc = m.location?.url ? ` (${m.location.url}:${m.location.lineNumber})` : ''
    console.log(`  ✖ ${m.text}${loc}`)
  })
}
if (warns.length) {
  console.log('\n── CONSOLE WARNINGS ──')
  warns.forEach((m) => console.log(`  ⚠ ${m.text}`))
}
if (failedRequests.length) {
  console.log('\n── FAILED / ERROR RESPONSES ──')
  failedRequests.forEach((r) =>
    console.log(`  ✖ ${r.status ?? r.error}  ${r.url}`),
  )
}

console.log('')
process.exit(errs.length || pageErrors.length ? 2 : 0)
