# Case Study - Suavius Atelier

A production e-commerce store for a boutique brand making hand-designed PCB coasters
(FR4 + ENIG copper finish) and laser-engraved wood accessories. It is a real shop taking
real orders, built deliberately to double as a portfolio piece: a modern headless-CMS
commerce stack, self-hosted, on a single deploy, with the operational discipline of a
product rather than a demo.

This document is a technical walkthrough of *how the system is built and why* - the
external services, how payments and data flow, the security posture, and the deployment
pipeline. It is meant for anyone evaluating whether this is the kind of engineering they
want on an analogous project.

---

## TL;DR

- **One Next.js 16 app** hosts both the storefront and the **Payload CMS 3** admin/API.
  No separate backend service, no HTTP hop between the frontend and the CMS - the
  storefront reads through Payload's Local API directly inside server components.
- **Stripe Checkout** for payments, wired through a **draft-order + webhook** flow with
  an atomic, exactly-once claim so a payment is never double-counted and cart data is
  never lost.
- **Server-authoritative pricing.** The client submits *choices*, never prices. Every
  amount (base price, personalization upcharges, shipping, tax) is recomputed server-side
  before a Stripe session is created.
- **Product personalization** (engraving text, colour/style choices, customer artwork
  uploads) with hardened, content-sniffed, DOMPurify-sanitized file uploads.
- **Content is live without a deploy.** Editing in the production admin revalidates exactly
  the affected routes via Payload hooks -> Next.js on-demand ISR. Deploys are for code only.
- **Hard quality gates** (Husky pre-commit/pre-push, `pnpm verify`, post-deploy health
  check) so a broken build never reaches production.

---

## At a glance

| Layer            | Technology                                                        |
|------------------|-------------------------------------------------------------------|
| Framework        | Next.js 16 (App Router), React 19, TypeScript (strict)            |
| CMS / API        | Payload CMS 3 (self-hosted inside the Next app)                   |
| Database         | PostgreSQL on Neon (serverless, branched dev/prod)               |
| Object storage   | Cloudflare R2 (S3-compatible, zero-egress)                       |
| Payments         | Stripe Checkout + webhooks                                        |
| Rate limiting    | Upstash Redis (serverless)                                        |
| Redirects        | Vercel Edge Config (edge KV) + middleware                        |
| Transactional email | SMTP via Nodemailer                                            |
| Hosting / CDN    | Vercel                                                            |
| Analytics        | Vercel Analytics + Speed Insights (cookieless)                   |
| Styling          | Tailwind CSS 4 (design tokens in `@theme`)                       |
| Tooling          | pnpm, ESLint 9, Prettier, Husky, lint-staged, Renovate, Playwright |

---

## Architecture overview

```
                         ┌───────────────────────────────────────────┐
                         │              Vercel (one deploy)            │
                         │                                             │
   Browser ──────────────▶  Next.js 16 app                            │
     │                   │   ├── (frontend)  storefront routes (SSR/ISR)
     │                   │   ├── (payload)   /admin + REST + GraphQL   │
     │                   │   └── /api/*       checkout, webhook, etc.  │
     │                   │            │                                │
     │                   │            │ Payload Local API (in-process) │
     │                   │            ▼                                │
     │                   │      Payload CMS 3 ───────────┐             │
     │                   └───────────────┬───────────────┼────────────┘
     │                                   │               │
     │  (image GET, direct)              │               │
     ▼                                   ▼               ▼
 Cloudflare R2                      Neon Postgres    External services
 (product media,                   (dev / prod        Stripe · Upstash Redis
  customer uploads)                 branches)          SMTP · Edge Config
```

**Why one app.** Payload 3 runs as a set of routes *inside* the Next.js app rather than
as a standalone server. The storefront reads content through Payload's Local API - direct
function calls, no network round-trip - so SSR stays fast and there is exactly one thing to
deploy, one set of env vars, one runtime to reason about. The admin panel, REST API and
GraphQL API are all just route groups in the same project.

**Route groups:**
- `(frontend)` - the public storefront (home, catalogue, product pages, collections,
  categories, bespoke/materials/contact pages, order confirmation, CMS-driven `[slug]`
  pages, and the draft-preview enter/exit routes).
- `(payload)` - the Payload admin UI and its REST + GraphQL endpoints.
- `api/` - bespoke endpoints the storefront calls: checkout session creation, the Stripe
  webhook, newsletter, contact, product search, stock alerts, and personalization upload.

---

## External services - what, why, how they connect

### Vercel - hosting, CDN, build pipeline
The whole app deploys to Vercel; pushing to `main` triggers a production deploy. The build
command runs database migrations **before** the Next build on production only, so schema
changes ship atomically with the code that depends on them:

```jsonc
// vercel.json
"buildCommand": "if [ \"$VERCEL_ENV\" = \"production\" ]; then pnpm payload migrate; fi && pnpm build"
```

Pages are statically prerendered / ISR-cached; Vercel's edge serves them and runs the
middleware layer (used for redirects, below).

### Neon - PostgreSQL (branched dev/prod)
Payload persists to Postgres through `@payloadcms/db-postgres`. Neon's branching gives a
**separate dev branch and prod branch** off the same database, so local development never
touches production data and vice versa. Local dev reads its branch from the local env;
Vercel injects the production connection string as a sensitive (unreadable) env var.

A real-world gotcha that was diagnosed and fixed here: Neon's connection *pooler* can hand
out backends whose `search_path` doesn't include `public`, producing intermittent
`relation "X" does not exist` errors during migrate / SSG / runtime. The fix -
`ALTER ROLE … SET search_path TO "$user", public` - is documented in
[docs/operations.md](docs/operations.md) along with the reasoning, so the next person
doesn't lose a day to it.

### Cloudflare R2 - object storage
Product imagery and customer artwork uploads live in R2 via `@payloadcms/storage-s3`
(R2 is S3-compatible). Two logical buckets-by-prefix are configured: `media/` for curated
product images and a separate prefix for customer `personalization-uploads/`.

Two deliberate touches:
- An `afterRead` hook rewrites each media `url` to R2's public hostname, so the browser
  fetches images **directly from R2** - bypassing the Next.js server and leaning on R2's
  zero-egress pricing.
- An `afterChange` hook stamps long-lived immutable `Cache-Control` headers on the stored
  objects (and `Content-Disposition: attachment` on customer uploads, see Security).

### Stripe - payments
Stripe Checkout (hosted) handles card entry, automatic tax, shipping options, promotion
codes and VAT-ID collection. The integration is intentionally *thin on the client and thick
on the server*: the browser only ever hands Stripe a session URL that the server built.
Order finalization happens through a signed webhook. Full flow below.

### Upstash Redis - rate limiting
Serverless Redis backs sliding-window rate limits on the abuse-prone endpoints, with limits
tuned per endpoint:
- checkout session creation - tightest payment-abuse guard,
- personalization file upload - tight, since it accepts binary data,
- contact / newsletter / stock-alert forms - spam guard.

Client IP is derived from the forwarded headers; exceeding a limit returns `429` with a
`Retry-After`.

### Vercel Edge Config - redirects at the edge
SEO 301/308 redirects are served at the edge by middleware reading from Edge Config. The
`Redirects` collection mirrors its rows into Edge Config on change, so editors manage
redirects in the admin and the edge map stays in sync. There's a graceful in-page soft
fallback if Edge Config isn't configured - nothing breaks, it just degrades to a slower path.

### SMTP - transactional email
Order confirmations, shipment notifications, back-in-stock alerts and contact-form relays
go out over SMTP via Nodemailer (also wired as Payload's mail adapter for admin mail like
password resets). The transport is built lazily with verification skipped, so the SMTP
connection is never opened at build/boot time - a Vercel build can't hang or fail on it,
and mail is only sent when actually triggered.

### Vercel Analytics & Speed Insights - measurement
Cookieless analytics and real-user performance metrics, chosen specifically so the site
needs no analytics cookie banner.

---

## Data model

Payload collections (each is a Postgres-backed, fully-typed collection with generated
TypeScript types) and one global:

| Collection | Purpose |
|---|---|
| **Products** | Catalogue items: pricing in minor units, `compareAtPrice`, material, variants (`sku` + `stock`), a virtual `totalStock`, pinned personalization options, shipping dimensions/weight, SEO fields. Drafts + version history. |
| **Orders** | Created as a *draft* at checkout, finalized by the Stripe webhook. Stores customer + address, line items with a **personalization snapshot** and `priceAtPurchase`, shipping/tax/totals, currency, promo code, tracking. |
| **Media** | Curated image library; R2-backed, URL-rewritten and cache-stamped. |
| **Categories** | Product taxonomy (supports nesting). |
| **Collections** (design themes) | Curated landing pages (e.g. Botanical, Sport, Abstract) with hero, tagline and a hand-picked product list. |
| **Pages** | CMS-driven marketing/legal pages (About, Shipping, FAQ, Terms, Privacy…). Drafts + preview. |
| **PersonalizationOptions** | Reusable library of personalization *types* (text, textarea, choice, colour, file) with per-option pricing, choice lists, presentation, and file-upload config. |
| **PersonalizationUploads** | Customer-uploaded artwork (R2-backed), with checksum, sanitized flag, and a reserved scan-status field. Direct create is blocked - uploads only via the validated endpoint. |
| **StockAlerts** | Back-in-stock waitlist; triggers email on restock. Stores GDPR consent timestamp + snapshot. |
| **NewsletterSubscribers** | Email list with source, unsubscribe flag and consent snapshot. |
| **ContactMessages** | Contact-form submissions with IP/user-agent and a handled flag. |
| **Redirects** | `from -> to` with permanent flag; auto-created on slug changes, mirrored to Edge Config. |
| **Users** | Admin authentication (Payload's built-in auth). |
| **Settings** (global) | Store name/email, shipping zones (country list + flat rate), social links, announcement bar. |

**Money is always integers in minor units** (cents/grosze) end to end; display formatting is
centralized in one `formatPrice` helper. This sidesteps an entire class of floating-point
rounding bugs.

---

## Key flows

### 1. Checkout & payment (draft order + atomic webhook)

The hard part of commerce is not taking a card - it's making sure the order, the money and
the stock all agree exactly once, even when webhooks retry or replicas race. The design:

1. **Client** posts the cart (product IDs, variant SKUs, quantities, personalization
   choices) to `/api/checkout/session`.
2. **Server validates everything from scratch:** rate limit -> products exist -> variants
   in stock -> personalization choices are legal for *that* product -> recompute every price.
   The client's numbers are never trusted.
3. **Server creates a draft `Order`** (`status: pending`) holding the validated line items
   and a personalization snapshot - *before* talking to Stripe. If the customer pays but a
   webhook is delayed, the order intent already exists.
4. **Server creates the Stripe Checkout session** with automatic tax, shipping options
   built from the store's shipping zones, promo codes, and VAT-ID collection. The draft
   order id and the site URL are written into session `metadata`. The session id is linked
   back onto the draft.
5. **Customer pays** on Stripe's hosted page.
6. **Stripe fires `checkout.session.completed`** to `/api/webhooks/stripe`:
   - The signature is verified against the webhook secret (reject `400` otherwise).
   - The session's `siteUrl` metadata is checked against this deployment - a guard against
     cross-environment replays.
   - The draft order is **atomically claimed** with a compare-and-set:
     `UPDATE orders SET status='paid' WHERE id=? AND status='pending'`. Only one replica can
     win; if zero rows update, another already processed it and this invocation bails before
     touching stock or email. **Exactly-once, enforced by the database.**
   - Real customer/shipping/tax/total/promo details are copied from the session onto the order.
   - **Stock is decremented atomically per variant** (`… SET stock = stock - qty WHERE sku=? AND stock >= qty`), with oversell detection.
   - Confirmation email goes to the customer; a fulfilment copy goes to the store.

A legacy snapshot path is kept for backward compatibility, so the migration to draft orders
didn't strand any in-flight sessions - a detail that matters when you change a payment flow
on a live store.

### 2. Personalization & secure uploads

Personalization options are defined once in a reusable library and *pinned* onto products,
so copy and pricing can change globally while historical orders stay readable via their
snapshot.

For file uploads (customer artwork for engraving), the upload endpoint is treated as hostile
input by default:
- **Content-sniffed type detection** from magic bytes (PNG/JPEG/PDF) or an XML sniff for
  SVG - the file extension is never trusted.
- **SVG sanitization**: reject on `DOCTYPE`/`ENTITY`/`<script>`/`foreignObject`/event
  handlers/`javascript:` URIs/iframes/embeds/external `<use>`, then run through DOMPurify's
  SVG profile, and reject if sanitization strips the root. Stored bytes are the *clean* bytes.
- **Server-generated filenames** (UUID) to kill path-traversal.
- **Served as `Content-Disposition: attachment`** from a separate R2 origin, so an uploaded
  file can never execute in the store/admin session context.
- **SHA-256 checksum** stored for integrity/dedup/abuse fingerprinting.
- Direct collection writes are disabled - the only way in is the validated endpoint, behind
  a tight rate limit.

At checkout the server re-validates that every referenced upload and choice is legal for the
product before the price is computed. The uploaded artwork link is surfaced to the store in
the order email for fulfilment.

### 3. Content editing & on-demand revalidation

Public pages are statically prerendered / ISR-cached. Editing content in the **production
admin** writes to the prod database and shows on the live site **immediately, with no
redeploy**: Payload `afterChange`/`afterDelete` hooks call `revalidatePath` for *exactly*
the affected routes:
- a product -> its page + the catalogue + home + its category + any collections that include
  it + the sitemap,
- a category/collection/page -> its own page plus relevant listings,
- the Settings global -> a whole-tree layout revalidation (header/footer everywhere),
- a slug change -> both the old and the new path.

Deploys are reserved for code; content lives in the database. Time-based revalidation
windows remain as a safety net.

### 4. Drafts & preview

Products, Pages and Collections keep version history with drafts. Public read access is
gated by an `authenticatedOrPublished` rule: anonymous visitors only ever see published
content; the storefront query is constrained to `_status: published`. The admin's
"Preview" button opens a route that authenticates the editor's Payload session, enables
Next.js Draft Mode, and renders the unpublished draft - so editors see exactly what will
ship before they publish, without leaking drafts publicly.

### 5. Redirects (two layers, no broken links on rename)

When a product/page/collection/category slug changes, a hook auto-creates a permanent
redirect from the old path, collapses redirect chains, and clears stale redirects that would
shadow the new path. These rows are mirrored into Edge Config and applied as hard 301/308s by
middleware at the edge; an in-page soft fallback covers the case where Edge Config isn't
wired. Editors never have to think about SEO link rot.

---

## Security posture

Security here is layered and intentional, not an afterthought:

- **Content-Security-Policy** with a tight allowlist (Stripe + Vercel analytics origins
  only), plus `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`,
  `Permissions-Policy`, and a one-year HSTS with preload. The CSP decision is documented in
  code: a static policy was chosen over a per-request nonce because nonce + `strict-dynamic`
  is fundamentally incompatible with statically/ISR-cached HTML (the cached page carries no
  nonce while the header demands one, breaking hydration). The site renders no untrusted
  HTML, so the residual exposure is low and the tradeoff is written down rather than guessed.
- **Webhook signature verification** + cross-environment replay guard.
- **Server-authoritative pricing** - the client cannot influence any amount.
- **Exactly-once order processing** via a database compare-and-set; idempotent under
  webhook retries and multi-replica races.
- **Hardened uploads** - content sniffing, SVG sanitization, attachment disposition,
  origin isolation (detailed above).
- **Per-endpoint rate limiting** on Upstash Redis.
- **GDPR consent capture** - newsletter / stock-alert / contact flows snapshot the exact
  consent wording, timestamp and IP at the moment of consent, so consent is provable later.
- **Honeypot fields** on public forms for low-friction bot rejection.
- Secrets live only in Vercel env vars (production `DATABASE_URL` is a sensitive, unreadable
  var); nothing sensitive is committed. A secret-rotation runbook lives in
  [docs/runbooks/secret-rotation.md](docs/runbooks/secret-rotation.md).

---

## Deployment & operations

- **Push-to-deploy.** Push `main` -> Vercel runs `pnpm payload migrate` (prod only) then
  `pnpm build`, statically prerendering pages.
- **Local hard gates (Husky):**
  - *pre-commit* runs `lint-staged` (`eslint --fix` on staged files),
  - *pre-push* runs `pnpm lint && pnpm typecheck` over the whole repo - exactly the checks
    that fail a production build, so a broken build never even reaches Vercel.
- **`pnpm verify`** - `lint + typecheck + full local build`, the pre-deploy gate. If it's
  green locally, the Vercel build is green too.
- **`pnpm deploy:check`** - a post-deploy Playwright gate that waits for the deployment,
  surfaces build-log errors, then health-checks the **live** site (HTTP status of key routes
  + real-browser console/JS/network errors). "Dev-console-clean + deploy-check-clean" is the
  done bar.
- **`pnpm inspect <path>`** - a Playwright tool that screenshots a route and reports its
  console/JS/network errors, used to sweep touched pages before pushing.
- **Migrations** are Payload-managed in `src/migrations/`, applied automatically on prod
  deploy and recorded so applied ones are skipped.
- **Renovate** keeps dependencies current with grouped, scheduled, age-gated PRs (Payload,
  Next, React, Stripe and AWS SDK grouped; security updates fast-tracked; majors require
  manual approval).
- **Operational knowledge is written down**, not tribal: [docs/operations.md](docs/operations.md)
  covers the deploy flow, the Neon pooler `search_path` fix, how to run scripts safely
  against the prod database (always `NODE_ENV=production`, always back up first), and the
  redirect architecture.

---

## Engineering decisions worth calling out

- **Draft orders before payment.** Trades a little extra write for guaranteed order intent
  and a clean place to attach the validated snapshot - the order never depends on the
  webhook arriving to *exist*.
- **Compare-and-set for finalization.** The simplest correct primitive for exactly-once: no
  distributed lock, no queue - just a conditional `UPDATE` the database serializes for you.
- **Local API over HTTP.** Co-locating the CMS in the Next app removes a network hop and an
  entire class of auth/CORS/latency problems for SSR reads.
- **Direct-from-R2 images.** Offloads bandwidth from the app server and exploits R2's
  zero-egress pricing - a cost decision as much as a performance one.
- **Static CSP, documented.** The harder-but-honest choice for cached HTML, with the
  reasoning committed next to the code.
- **Design tokens in `@theme`.** Brand palette and typography live as CSS variables Tailwind
  4 reads automatically - changing one hex restyles the whole UI.
- **Money as integers.** No floats anywhere near currency.

---

## What this project demonstrates

- Designing and shipping a **real, correctness-critical payment flow** (idempotency,
  replay protection, server-authoritative pricing, stock integrity) rather than a happy-path
  demo.
- Comfort across a **modern full-stack TypeScript surface**: Next.js App Router + React 19
  server components, a headless CMS, Postgres, S3-compatible storage, edge config and
  serverless Redis - wired together coherently on a single deploy.
- A genuine **security mindset**: CSP and security headers, hostile-input handling for file
  uploads, rate limiting, GDPR-grade consent capture, secret hygiene.
- **Operational maturity**: automated quality gates, migrations-on-deploy, post-deploy
  health checks, dependency automation, and durable written runbooks so the system is
  maintainable by someone who isn't the original author.
- **Judgement and documentation** - the non-obvious tradeoffs (static CSP, draft orders,
  the Neon pooler fix) are reasoned about and written down, not left as folklore.

---

*Stack: Next.js 16 · React 19 · TypeScript · Payload CMS 3 · PostgreSQL (Neon) ·
Cloudflare R2 · Stripe · Upstash Redis · Vercel · Tailwind CSS 4.*
