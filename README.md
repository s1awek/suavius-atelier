# Suavius Atelier

Premium e-commerce store for **Suavius Atelier** - a boutique brand making hand-designed PCB
coasters (FR4 + ENIG copper finish) and laser-engraved wood accessories. The store doubles as
a portfolio piece demonstrating a modern headless CMS stack.

> **Status:** Phase 0 (scaffold) complete. Phase 1 (Stripe checkout + cart) is next.

## Stack

| Layer        | Tech                                          |
|--------------|-----------------------------------------------|
| CMS          | [Payload CMS 3](https://payloadcms.com) (self-hosted) |
| Frontend     | [Next.js 16](https://nextjs.org) App Router, React 19 |
| Database     | PostgreSQL ([Neon](https://neon.tech))        |
| Object store | [Cloudflare R2](https://developers.cloudflare.com/r2/) (S3-compatible) |
| Styling      | [Tailwind CSS 4](https://tailwindcss.com)     |
| Language     | TypeScript (strict)                           |
| Hosting      | [Vercel](https://vercel.com)                  |

## Local setup

Prerequisites: Node 20+, pnpm 9+, a Neon Postgres URL, and Cloudflare R2 credentials.

```bash
git clone https://github.com/s1awek/suavius-atelier.git
cd suavius-atelier
cp .env.example .env
# Fill in DATABASE_URL, PAYLOAD_SECRET, and R2_* variables in .env
pnpm install
pnpm dev
```

Open [http://localhost:3000/admin](http://localhost:3000/admin) - on the first visit Payload
will prompt you to create the initial admin user. After that, the admin panel is at `/admin`
and the storefront at `/`.

To populate the store with a few example products and images:

```bash
pnpm seed
```

This pulls placeholder photographs from `picsum.photos`, uploads them to R2, and creates
two categories plus three products. The script is idempotent - running it again is a no-op.

## Project layout

```
src/
├── payload.config.ts         Payload CMS config (collections, globals, db, R2 plugin)
├── payload-types.ts          Generated TypeScript types (pnpm generate:types)
├── collections/              Payload collections - Users, Media, Categories,
│                             Products, Orders, Pages
├── globals/                  Payload globals - Settings (store name, shipping,
│                             social links, announcement bar)
├── lib/                      Shared helpers (Payload Local API client, price formatter)
├── components/               Server components - Header, Footer, ProductCard
├── seed/                     Idempotent seed script (categories + products + media)
└── app/
    ├── (frontend)/           Storefront routes - home, /products, /products/[slug],
    │                         /categories/[slug]
    └── (payload)/            Payload admin panel + REST/GraphQL API endpoints
```

## Architectural notes

- **One Next.js app, one deploy.** Payload runs as a set of routes inside the Next.js app
  rather than as a separate service. The storefront reads from Payload through the Local API
  (no HTTP round-trips), so SSR is fast.
- **R2 with direct-serve URLs.** Uploaded media is stored in R2 via the `@payloadcms/storage-s3`
  plugin. An `afterRead` hook on the `Media` collection rewrites `doc.url` to the R2 public
  hostname (`pub-*.r2.dev`) so the storefront serves images directly from R2 - bypassing the
  Next.js server and taking advantage of R2's zero-egress pricing.
- **Prices in minor units.** All prices are stored as integers in the smallest currency unit
  (cents/groszy). Display formatting goes through `formatPrice` in [lib/payload.ts](src/lib/payload.ts).
- **Brand tokens in CSS.** Color palette and typography variables live in `@theme` inside
  [styles.css](src/app/(frontend)/styles.css). Tailwind 4 picks them up automatically - changing
  a hex updates the entire UI.

## Scripts

```bash
pnpm dev              # Next.js dev server (Turbopack)
pnpm build            # Production build
pnpm start            # Run the production build
pnpm seed             # Populate the store with example categories, products, media
pnpm generate:types   # Regenerate src/payload-types.ts from collections + globals
pnpm lint
```

## Roadmap

- [x] **Phase 0** - Scaffold: collections, frontend skeleton, R2, seed
- [ ] **Phase 1** - MVP: Stripe Checkout, cart (Zustand), order webhook, Resend confirmation emails, static pages (About / Shipping / FAQ / Contact), SEO basics (sitemap, OG)
- [ ] **Phase 2** - Launch ready: real product photos and copy, flat-rate shipping zones, Plausible analytics, performance pass
- [ ] **Phase 3** - Growth: blog, variant UI, discount codes, wishlist, pl/en i18n

## License

MIT
