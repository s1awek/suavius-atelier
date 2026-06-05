#!/usr/bin/env node
/**
 * Post-deploy gate: waits for the newest production deployment to finish, surfaces the
 * build error if it failed, and otherwise health-checks the live site (HTTP status of
 * key routes + browser console/JS/network errors). One command, clear pass/fail.
 *
 * Usage:
 *   node tools/check-deploy.mjs                 # wait for latest prod deploy, then check live
 *   node tools/check-deploy.mjs --no-wait       # skip deploy polling, just check the live site
 *   node tools/check-deploy.mjs --url=https://staging.example.com
 *
 * Env overrides (read from the environment or a local gitignored .env): VERCEL_PROJECT
 * (default suavius-atelier), VERCEL_SCOPE (team slug, no default - keep it out of the repo),
 * DEPLOY_CHECK_URL (default https://suaviusatelier.com).
 *
 * Exit codes: 0 = all good, 1 = deploy failed, 2 = deploy ok but live checks found errors.
 */
import 'dotenv/config'
import { execSync } from 'node:child_process'
import { chromium } from 'playwright'

const PROJECT = process.env.VERCEL_PROJECT ?? 'suavius-atelier'
const SCOPE = process.env.VERCEL_SCOPE ?? ''
const SITE = process.env.DEPLOY_CHECK_URL ?? 'https://suaviusatelier.com'
const ROUTES = [
  '/', '/products', '/collections', '/bespoke', '/materials',
  '/about', '/contact', '/faq', '/shipping-returns', '/terms', '/privacy', '/cookies',
]
// Routes to also open in a real browser for console/JS error capture.
const BROWSER_ROUTES = ['/', '/products', '/privacy']
const DEPLOY_TIMEOUT_MS = 8 * 60_000
const POLL_MS = 10_000

const args = process.argv.slice(2)
const noWait = args.includes('--no-wait')
const line = '─'.repeat(64)

function sh(cmd) {
  // vercel CLI prints its tables/status to stderr — merge it so we can parse the output.
  // It also exits non-zero for errored deployments while still printing useful output,
  // so swallow the throw and return whatever was captured.
  try {
    return execSync(`${cmd} 2>&1`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (e) {
    return `${e.stdout ?? ''}${e.stderr ?? ''}`
  }
}
function vercel(sub) {
  return sh(`vercel ${sub}${SCOPE ? ` --scope ${SCOPE}` : ''}`)
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function latestProdDeployment() {
  const out = vercel(`ls ${PROJECT}`)
  for (const l of out.split('\n')) {
    if (!/Production/.test(l)) continue
    const url = l.match(/https:\/\/[^\s]+\.vercel\.app/)?.[0]
    if (url) return url
  }
  return null
}
function statusOf(url) {
  const out = vercel(`inspect ${url}`)
  const m = out.match(/status\s+●?\s*(\w+)/i)
  return m ? m[1].toLowerCase() : 'unknown'
}

async function waitForDeploy() {
  const url = latestProdDeployment()
  if (!url) {
    console.log('⚠ Could not find a production deployment via vercel CLI; skipping deploy wait.')
    return { ok: true, url: null }
  }
  console.log(`Newest production deployment: ${url}`)
  const deadline = Date.now() + DEPLOY_TIMEOUT_MS
  let status = statusOf(url)
  while (!['ready', 'error', 'canceled'].includes(status) && Date.now() < deadline) {
    process.stdout.write(`  status: ${status} …\r`)
    await sleep(POLL_MS)
    status = statusOf(url)
  }
  console.log(`  status: ${status}            `)
  if (status === 'ready') return { ok: true, url }

  // Failed (or timed out) — pull the build error.
  console.log(`\n${line}\n❌ DEPLOY ${status.toUpperCase()} — build error:\n${line}`)
  try {
    const logs = vercel(`inspect ${url} --logs`)
    const errLines = logs
      .split('\n')
      .filter((l) => /error|fail|exited with|relation .* does not exist|already exists|cannot|module not found/i.test(l))
      .slice(-25)
    console.log(errLines.join('\n') || '(no error lines matched; run: vercel inspect ' + url + ' --logs)')
  } catch {
    console.log(`(could not fetch logs; run: vercel inspect ${url} --logs --scope ${SCOPE})`)
  }
  return { ok: false, url, status }
}

// Boilerplate build-log lines that are always present and not actionable.
const BENIGN_LOG = [
  /engines.*node/i, /engines.*pnpm/i, /corepack/i,
  /SSL modes .* (are )?treated as aliases/i, /Download the React DevTools/i,
  /(Skipping|Restoring|Storing|Created) build cache/i, /Build cache/i,
  /Collecting build traces/i, /Compiled successfully/i, /deprecation/i,
]
// Surface warnings/errors from the build log even on a successful deploy, so a
// noisy-but-passing build (e.g. a missing adapter, a Node warning) is still visible.
function scanBuildLog(url) {
  let logs = ''
  try {
    logs = vercel(`inspect ${url} --logs`)
  } catch {
    return []
  }
  const seen = new Set()
  const out = []
  for (const raw of logs.split('\n')) {
    if (!/\b(error|warn|warning|✕|⨯|cannot|unable|failed|exited with)\b/i.test(raw)) continue
    if (BENIGN_LOG.some((re) => re.test(raw))) continue
    const msg = raw.replace(/^\S+\s+/, '').trim() // strip leading ISO timestamp
    if (!msg || seen.has(msg)) continue
    seen.add(msg)
    out.push(msg)
  }
  return out.slice(-30)
}

// A failed request is benign if it's a Next.js RSC prefetch abort or a favicon miss.
function isBenign(req) {
  return /[?&]_rsc=/.test(req.url) || /favicon\.ico/.test(req.url) ||
    (req.error === 'net::ERR_ABORTED' && /\.vercel\.app|suavius/.test(req.url) && /_rsc/.test(req.url))
}

async function checkLive() {
  console.log(`\n${line}\nLive checks against ${SITE}\n${line}`)

  // 1) HTTP status of key routes
  let statusFails = 0
  for (const route of ROUTES) {
    let code = 0
    try {
      const res = await fetch(SITE + route, { redirect: 'manual' })
      code = res.status
    } catch {
      code = 0
    }
    const ok = code >= 200 && code < 400
    if (!ok) statusFails++
    console.log(`  ${ok ? '✓' : '✗'} ${code || 'ERR'}  ${route}`)
  }

  // 2) Browser console / JS / network errors
  const browser = await chromium.launch()
  const consoleErrors = []
  const pageErrors = []
  const failed = []
  for (const route of BROWSER_ROUTES) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push({ route, text: m.text() })
    })
    page.on('pageerror', (e) => pageErrors.push({ route, text: e.message }))
    page.on('requestfailed', (r) => {
      const req = { url: r.url(), error: r.failure()?.errorText ?? 'failed' }
      if (!isBenign(req)) failed.push({ route, ...req })
    })
    page.on('response', (r) => {
      if (r.status() >= 400 && !isBenign({ url: r.url() })) {
        failed.push({ route, url: r.url(), error: `HTTP ${r.status()}` })
      }
    })
    try {
      await page.goto(SITE + route, { waitUntil: 'networkidle', timeout: 30_000 })
    } catch (e) {
      failed.push({ route, url: SITE + route, error: `navigation: ${e.message}` })
    }
    await page.close()
  }
  await browser.close()

  console.log(`\n  console errors: ${consoleErrors.length}`)
  consoleErrors.forEach((e) => console.log(`    ✖ [${e.route}] ${e.text}`))
  console.log(`  uncaught JS errors: ${pageErrors.length}`)
  pageErrors.forEach((e) => console.log(`    ✖ [${e.route}] ${e.text}`))
  console.log(`  failed requests (excl. benign prefetch/favicon): ${failed.length}`)
  failed.forEach((e) => console.log(`    ✖ [${e.route}] ${e.error}  ${e.url}`))

  const problems = statusFails + consoleErrors.length + pageErrors.length + failed.length
  return problems
}

async function main() {
  let deployFailed = false
  let buildNotices = []
  if (!noWait) {
    const r = await waitForDeploy()
    deployFailed = !r.ok
    if (!deployFailed && r.url) {
      buildNotices = scanBuildLog(r.url)
      console.log(`\n${line}\nBuild log warnings/errors: ${buildNotices.length}\n${line}`)
      buildNotices.forEach((n) => console.log(`  ⚠ ${n}`))
    }
  }
  if (deployFailed) {
    console.log(`\n${line}\nRESULT: ❌ deploy failed — fix the build before checking live.\n${line}`)
    process.exit(1)
  }

  const liveProblems = await checkLive()
  console.log(`\n${line}`)
  if (liveProblems === 0 && buildNotices.length === 0) {
    console.log('RESULT: ✅ deploy ready, build log clean, live site clean (no errors).')
    console.log(line)
    process.exit(0)
  }
  const parts = []
  if (buildNotices.length) parts.push(`${buildNotices.length} build-log warning(s)`)
  if (liveProblems) parts.push(`${liveProblems} live issue(s)`)
  console.log(`RESULT: ⚠ deploy ready but ${parts.join(' + ')} above need attention.`)
  console.log(line)
  process.exit(liveProblems ? 2 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
