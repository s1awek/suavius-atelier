# Operations & deployment notes

Durable operational knowledge for the Suavius Atelier store. Written after the 2026-05-27
session where several of these gotchas cost real time.

## Stack

- **Hosting:** Vercel (project + team configured in the Vercel dashboard; the deploy-check
  script reads them from `VERCEL_PROJECT` / `VERCEL_SCOPE`). Push to `main`
  auto-deploys to production.
- **Database:** Neon Postgres, **two separate branches** (endpoint ids live only in the
  respective `DATABASE_URL`, not in the repo):
  - dev branch — used by local dev (loaded from `.env`)
  - production branch — used by Vercel
  - Vercel's `DATABASE_URL` is a Sensitive env var (unreadable after saving). Pull the prod
    string from the Neon console when a maintenance script genuinely needs it.
- **Storage:** Cloudflare R2 (product images). **Payments:** Stripe. **Email:** SMTP
  (provider + mailbox live in `SMTP_HOST` / `SMTP_USER`, not in the repo) via
  `src/lib/email.ts` (transactional) + Payload's nodemailer adapter (admin/internal mail).

## Deploy flow

`vercel.json` build command (production only):
`pnpm payload migrate && pnpm build`. So every prod deploy runs DB migrations, then the
Next build (which statically prerenders pages — see `generateStaticParams`).

### Local guardrails (automatic — Husky)

Git hooks enforce quality so a broken build never reaches Vercel:

- **pre-commit** runs `lint-staged` → `eslint --fix` on staged JS/TS files. A commit with
  lint errors is blocked.
- **pre-push** runs `pnpm lint && pnpm typecheck` over the whole repo. A push with any lint
  error or type error is blocked — and those are exactly what fails a production build.

Bypass only in a real emergency with `--no-verify` (and then fix forward immediately).

### Deploy checklist

Before pushing to `main`:
1. `pnpm verify` — runs `lint` + `typecheck` + a full local `pnpm build`. This is the
   pre-deploy gate: if it's green, the Vercel build will be too. (`next build` type-checks
   the whole repo including `scripts/` and `tools/`, so one stray type error fails prod.)
2. Sweep the dev console for the routes you touched: `pnpm inspect <path> --w=800`
   (screenshots + reports console/JS/network errors).

After deploying: `pnpm deploy:check` — waits for the deployment, surfaces build-log
warnings/errors, and checks the **production** live site (HTTP status + browser
console/JS/network). Treat dev-console-clean + deploy:check-clean as the done bar.

Deploy cadence: batch related changes; deploy at sensible checkpoints. Don't deploy on
every tiny edit (clutters Vercel), don't let changes pile up for weeks either.

## Content editing & on-demand revalidation

Public pages are statically prerendered / ISR-cached (each route sets `revalidate`).
Editing content in the **production** admin (`/admin`, writes to the prod Neon branch)
shows on the live site **immediately** — no redeploy. Payload `afterChange`/`afterDelete`
hooks call `revalidatePath` for exactly the affected routes:

- product → its page + `/products` + `/` + its category + any collections that include it
- collection / category / page → own page + relevant listings + `/`
- Settings global → whole-tree layout revalidation (header/footer everywhere)
- slug/category change revalidates both the old and the new path

Code: hooks in `src/collections/hooks/revalidate.ts` (factory `makeHooks(resolver)` →
afterChange + afterDelete), helper `src/lib/revalidate.ts` (lazy `next/cache` import,
every call guarded — a safe no-op in CLI/seed contexts). Time-based `revalidate` windows
stay as a fallback. **Deploys are only for code changes; content lives in the DB.**

Gotcha: editing **locally** only touches the dev Neon branch and never reaches prod (the
prod build reads the prod branch). Real content is edited in the production admin.

## Redirects

`Redirects` collection (`from` -> `to`, `permanent`). Rows are auto-created when a
product/page/collection/category slug changes (`collections/hooks/redirect.ts`) and can be
added by hand. Two layers apply them:

1. **Hard 301/308 via middleware + Vercel Edge Config** (`src/middleware.ts`). The redirect
   map is mirrored into Edge Config by the Redirects collection hooks (`lib/edge-config-redirects.ts`).
   This is the SEO-correct path and needs these env vars:
   - `EDGE_CONFIG` — read connection string (also contains the `ecfg_…` id), auto-injected
     when the Edge Config store is connected to the project.
   - `EDGE_TOKEN` — a Vercel API token, used for writes via the Vercel REST API.
   - `VERCEL_TEAM_ID` — the team id (`team_…`), required for team-owned Edge Configs.

   After connecting the store, seed it once: `pnpm exec tsx scripts/sync-redirects-edge-config.ts`
   (with the prod `DATABASE_URL` + the write env vars).
2. **In-page fallback** (`lib/redirects.ts` `applyRedirect`, called from dynamic pages on a
   404). Works without Edge Config but is a soft redirect (200 + meta-refresh) because of
   streaming. Middleware runs first, so once Edge Config is set up this rarely fires.

If the Edge Config env vars are absent, the write is a no-op and only the soft fallback
applies — nothing breaks.

## Neon pooler + `search_path` (the big one)

Symptom: intermittent `relation "X" does not exist` (settings, pages, payload_migrations…)
during **migrate**, **build SSG**, or **runtime** — even though the tables exist. Cause:
the pooled connection (`-pooler` host) reuses PgBouncer backends whose `search_path`
doesn't include `public`, so unqualified table names don't resolve. It's intermittent, so
deploys "sometimes" pass.

Fix applied: `ALTER ROLE <db_owner_role> SET search_path TO "$user", public;` on the prod
branch (persists across compute restarts, applies to new backends). If bad backends are
already warm in the pool, they clear when the Neon compute **autosuspends** (~5 min idle)
or via "Restart compute" in the Neon console — a cold start spawns fresh backends.

When using `psql` against Neon directly: append `&sslrootcert=system` (verify-full needs a
CA) and **schema-qualify** tables (`public.pages`), since a one-off psql session may also
land on an empty-`search_path` backend.

## Running scripts against the production DB

```bash
# ALWAYS NODE_ENV=production — without it Payload boots in dev mode and tries to
# drizzle-push the schema over the pooler, which mutates prod and poisons the pool.
DATABASE_URL="<prod-url-from-the-Neon-console>" NODE_ENV=production \
  pnpm exec tsx scripts/<script>.ts
```

Back up first for any state change. A full `pg_dump` needs a client matching the server
major (Neon is PG 17; Ubuntu's pg_dump 16 refuses). For targeted backups, dump the rows
you'll touch as JSON: `psql "<url>&sslrootcert=system" -tAc "select row_to_json(t) from public.<table> t"`.

Existing helper: `scripts/update-legal-pages.ts` refreshes DB-stored legal page content
from the seed definitions (forces `NODE_ENV=production`, schema-qualified, idempotent).

## Migrations

Payload migrations live in `src/migrations/`. Workflow: `pnpm payload migrate:create`,
commit, push — the prod deploy runs `pnpm payload migrate` automatically. The baseline
`*_initial` migration is recorded in `payload_migrations`; migrate skips already-applied
ones (assuming the search_path issue above is resolved).
