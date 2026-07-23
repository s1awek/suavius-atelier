# Suavius Atelier

Production e-commerce store for **Suavius Atelier** - a boutique brand making hand-designed
PCB coasters (FR4 + ENIG copper finish) and laser-engraved wood accessories. It is a real
shop taking real orders, built deliberately to double as a portfolio piece: a modern
headless-CMS commerce stack on a single deploy, with the operational discipline of a product
rather than a demo.

**Live:** [suaviusatelier.com](https://suaviusatelier.com) · **Status:** in production since
May 2026.

> **[Read the full technical case study](CASE_STUDY.md)**
> How payments, stock, caching and security actually work, and why each tradeoff was made.

## Stack

| Layer               | Tech                                                              |
|---------------------|-------------------------------------------------------------------|
| Framework           | [Next.js 16](https://nextjs.org) (App Router), React 19            |
| CMS / API           | [Payload CMS 3](https://payloadcms.com), self-hosted inside the Next app |
| Database            | PostgreSQL on [Neon](https://neon.tech) (branched dev / prod)      |
| Object storage      | [Cloudflare R2](https://developers.cloudflare.com/r2/) (S3-compatible, zero egress) |
| Payments            | [Stripe Checkout](https://stripe.com) + signed webhooks            |
| Rate limiting       | [Upstash](https://upstash.com) Redis (sliding window)              |
| Redirects           | Vercel Edge Config + middleware                                    |
| Transactional email | SMTP via Nodemailer                                                |
| Hosting / CDN       | [Vercel](https://vercel.com) (push-to-deploy from `main`)          |
| Analytics           | Vercel Analytics + Speed Insights (cookieless, no cookie banner)   |
| Styling             | [Tailwind CSS 4](https://tailwindcss.com) (design tokens in `@theme`) |
| Language            | TypeScript (strict)                                                |
| Tooling             | pnpm, ESLint 9, Prettier, Husky, lint-staged, Renovate, Playwright  |

## Architecture in brief

- **One app, one deploy.** Payload 3 runs as a set of routes *inside* the Next.js app, not as
  a separate service. The storefront reads content through Payload's **Local API** - direct
  function calls, no HTTP round-trip - so SSR stays fast and there is one runtime, one build
  and one set of env vars to reason about.
- **Server-authoritative pricing.** The client submits *choices* (product, variant SKU,
  quantity, personalization), never prices. Every amount is recomputed server-side before a
  Stripe session is created.
- **Exactly-once order finalization.** Checkout writes a *draft* order before talking to
  Stripe; the webhook claims it with an atomic compare-and-set
  (`UPDATE … SET status='paid' WHERE id=? AND status='pending'`). Idempotent under webhook
  retries and multi-replica races, with no queue and no distributed lock.
- **One stock entry point.** Every movement (store order, Etsy sale, manual correction)
  goes through `adjustStock()`: a conditional atomic `UPDATE`, plus an audit log row
  carrying the source and an external idempotency key.
- **Content is live without a deploy.** Editing in the production admin revalidates exactly
  the affected routes via Payload hooks calling Next.js on-demand ISR. Deploys are for code
  only.
- **Money as integers** in minor units end to end, formatted in one place.

Security posture (CSP and headers, hardened customer uploads, per-endpoint rate limiting,
GDPR consent capture, webhook replay guards) is detailed in the
[case study](CASE_STUDY.md#security-posture).

## Local setup

Prerequisites: Node 20+, pnpm 9+, a Postgres connection string (Neon or local), and
Cloudflare R2 credentials.

```bash
git clone https://github.com/s1awek/suavius-atelier.git
cd suavius-atelier
cp .env.example .env      # fill in DATABASE_URL, PAYLOAD_SECRET, R2_*, STRIPE_*, SMTP_*
pnpm install
pnpm dev
```

Open [http://localhost:3000/admin](http://localhost:3000/admin) - on the first visit Payload
prompts you to create the initial admin user. The storefront is at `/`.

Populate the store with example content:

```bash
pnpm seed            # categories, products, media, CMS pages
pnpm seed:content    # marketing / legal page content only
pnpm seed:gallery    # gallery imagery
```

Seeds are idempotent - running them again is a no-op.

**Stripe webhooks locally.** The webhook drives order finalization, stock decrement,
confirmation email and newsletter opt-in, so none of that runs on a dev machine without
forwarding events:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Project layout

```
src/
├── payload.config.ts       Payload config: collections, globals, Postgres, R2, mail
├── payload-types.ts        Generated types (pnpm generate:types)
├── collections/            16 collections - Products, Orders, Media, Categories,
│   │                       Collections, Pages, PersonalizationOptions/Uploads,
│   │                       StockAlerts, StockMovements, NewsletterSubscribers,
│   │                       ContactMessages, ProductInterest, SearchEvents,
│   │                       Redirects, Users
│   └── hooks/              revalidate · redirect-on-slug-change · publish · restock notify
├── globals/                Settings (store info, shipping zones, socials, announcement bar)
├── access/                 Access control rules (authenticatedOrPublished)
├── lib/                    Stripe, stock, cart, email, rate limiting, revalidation,
│                           redirects, R2 hooks, upload validation, SEO/OG, consent
├── components/             Storefront + admin UI components
├── migrations/             Payload migrations (applied automatically on prod deploy)
├── seed/                   Idempotent seed scripts
└── app/
    ├── (frontend)/         Storefront: home, /products, /products/[slug], /collections,
    │                       /categories/[slug], /bespoke, /materials, /contact,
    │                       /order-confirmation, CMS-driven /[slug], draft preview routes
    ├── (payload)/          Payload admin panel + REST + GraphQL
    └── api/                checkout · stripe webhook · personalization upload · search ·
                            contact · newsletter · stock · stock-alerts · product-interest
docs/                       Operations notes and runbooks
scripts/                    Maintenance scripts (legal content, R2 cache, Edge Config sync)
tools/                      inspect.mjs (route screenshot + console audit), check-deploy.mjs
```

## Scripts

```bash
pnpm dev               # dev server
pnpm build             # production build
pnpm start             # run the production build

pnpm lint              # ESLint
pnpm typecheck         # tsc --noEmit
pnpm verify            # lint + typecheck + full build - the pre-deploy gate
pnpm deploy:check      # post-deploy: waits for the deploy, then health-checks the LIVE site
pnpm inspect <path>    # screenshot a route + report console/JS/network errors

pnpm generate:types    # regenerate src/payload-types.ts from the schema
pnpm payload migrate:create   # create a migration from schema changes
pnpm seed              # seed example content
```

## Quality gates

A broken build should never reach production, so the checks that fail a Vercel build run
locally first:

- **pre-commit** (Husky + lint-staged) - `eslint --fix` on staged files.
- **pre-push** (Husky) - `pnpm lint && pnpm typecheck` across the whole repo.
- **`pnpm verify`** before deploying - lint, typecheck and a full local build.
- **`pnpm deploy:check`** after deploying - waits for the deployment, surfaces build-log
  errors, then drives a real browser over the live site checking HTTP status and
  console/JS/network errors.
- **Migrations on deploy** - `vercel.json` runs `pnpm payload migrate` before the build on
  production only, so schema changes ship atomically with the code that needs them.
- **Renovate** keeps dependencies current with grouped, age-gated PRs; majors are manual.

Operational knowledge - the deploy flow, the Neon pooler `search_path` fix, how to run
scripts safely against the production database, and the redirect architecture - is written
down in [docs/operations.md](docs/operations.md), with a secret-rotation runbook in
[docs/runbooks/](docs/runbooks/secret-rotation.md).

## License

MIT
