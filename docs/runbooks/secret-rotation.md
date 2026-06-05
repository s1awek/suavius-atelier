# Secret rotation runbook

Procedura rotacji sekretów produkcyjnych. Trigger:
- Co 6 miesięcy (planowo).
- Niezwłocznie po podejrzeniu kompromitacji (kod w publicznym repo, lokalny laptop zgubiony, klucz w logach 3rd party, etc.).
- Przed launchem dla klientów (patrz pre-launch checklist).

Każda rotacja: **rotate → update Vercel env → redeploy → verify → revoke old**.
Old secret zostawiamy aktywny do czasu pomyślnej weryfikacji nowego, potem revoke.

Zakładamy hosting: Vercel (production env), DB: Neon, storage: Cloudflare R2, SMTP: SEOhost,
płatności: Stripe, rate limit: Upstash.

---

## 1. Stripe keys

**Wpływ:** checkout offline jeśli pomylimy. Webhook offline jeśli secret się rozjedzie.

Klucze:
- `STRIPE_SECRET_KEY` (`sk_live_...`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_live_...`)
- `STRIPE_WEBHOOK_SECRET` (`whsec_...`)

Procedura:
1. Stripe Dashboard → Developers → API keys → "Reveal live key" lub "Roll key" przy istniejącym
   secret key. Stripe pozwala mieć 2 aktywne klucze jednocześnie (old + new) z grace period.
2. Skopiuj nowy `sk_live_...` do Vercel Production env (`STRIPE_SECRET_KEY`).
3. Publishable key zmieniamy tylko jeśli całe konto rotujemy. Standardowo nie ruszamy.
4. Webhook secret: Developers → Webhooks → klik na endpoint → "Roll signing secret" →
   skopiuj nowy `whsec_...` do Vercel (`STRIPE_WEBHOOK_SECRET`).
5. Vercel → Deployments → Redeploy production.
6. Verify: pierwsza testowa transakcja (mała kwota, refund po sobie) + sprawdź
   webhook delivery w Stripe Dashboard (Recent deliveries).
7. Revoke old secret key w Stripe (po ~24h grace żeby in-flight requesty zdążyły).

Czas: ~15 min. Risk: medium (checkout błąd dla użytkowników mid-flow).

---

## 2. Neon DB password (production branch)

**Wpływ:** prod offline w trakcie. Aktywne sesje Payload admin wymuszą re-login po redeployu.

Klucze:
- `DATABASE_URL` (production branch connection string)

Procedura:
1. Neon Console → Project → Branches → production branch → Connection details →
   "Reset password" na roli właściciela bazy (domyślna rola ownera w Neon).
2. Skopiuj nowy connection string (z poolerem, `?sslmode=verify-full&channel_binding=require`).
3. Vercel → Production env → `DATABASE_URL` → update.
4. Vercel → Redeploy production (NIE robić tylko env update bez redeploy - stare instancje
   trzymają old connection w poolu).
5. Verify: otwórz `/admin` na prod, zaloguj się, sprawdź czy widzisz produkty / orders.
6. Stary password jest automatycznie zinwalidowany przez Neon - nie ma osobnego revoke.

Czas: ~10 min. Risk: high (mismatch = 500 errors site-wide). Window: best off-hours.

---

## 3. R2 keys (Cloudflare)

**Wpływ:** uploady do Payload admin failują. Serwowanie obrazków przez custom domain dalej działa
(public read przez `cdn.suaviusatelier.com` nie wymaga klucza).

Klucze:
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

Procedura:
1. Cloudflare Dashboard → R2 → Manage R2 API Tokens → "Create API token".
2. Permissions: Object Read & Write, Bucket: `suavius-atelier-media`, TTL: long-lived (lub
   1 rok jeśli chcemy częściej rotować).
3. Skopiuj `Access Key ID` + `Secret Access Key` (pokazane tylko raz).
4. Vercel → Production env → update obu kluczy.
5. Vercel → Redeploy production.
6. Verify: w `/admin/collections/media` spróbuj uploadu nowego pliku.
7. Cloudflare → R2 API Tokens → revoke old token.

Czas: ~10 min. Risk: low (read przez public URL nie zależy od kluczy).

---

## 4. SMTP password (SEOhost orders@suaviusatelier.com)

**Wpływ:** order confirmation maile failują. Webhook nadal tworzy Order w DB (try/catch chroni).

Klucze:
- `SMTP_PASSWORD`

Procedura:
1. SEOhost panel → Poczta → orders@suaviusatelier.com → Zmień hasło.
2. Vercel → Production env → `SMTP_PASSWORD` → update.
3. Vercel → Redeploy production.
4. Verify: zrób testowy purchase (mała kwota), sprawdź czy customer dostaje confirmation +
   admin dostaje notify na `storeEmail`.

Czas: ~5 min. Risk: low (failure mode jest gracefully handled).

---

## 5. Payload secret

**Wpływ:** wszystkie aktywne sesje admina + JWT tokens są inwalidowane. Wszyscy się przelogują.

Klucze:
- `PAYLOAD_SECRET` (32-byte hex)

Procedura:
1. Wygeneruj nowy: `openssl rand -hex 32`.
2. Vercel → Production env → `PAYLOAD_SECRET` → update.
3. Vercel → Redeploy production.
4. Verify: zaloguj się ponownie do `/admin`.

Czas: ~3 min. Risk: low (tylko re-login admin).

---

## 6. Upstash Redis token

**Wpływ:** rate limiting offline (fail-open w naszym kodzie → checkout nadal działa,
ale bez throttle).

Klucze:
- `UPSTASH_REDIS_REST_TOKEN`

Procedura:
1. Upstash Console → Database → Details → "Reset Token" (lub utwórz secondary token i potem
   delete primary).
2. Skopiuj nowy token.
3. Vercel → Production env → `UPSTASH_REDIS_REST_TOKEN` → update.
4. Vercel → Redeploy production.
5. Verify: zrób 11 szybkich POST na `/api/checkout/session` (z dowolnym body) i sprawdź
   czy 11-ty zwraca 429.

Czas: ~5 min. Risk: low (graceful degradation).

---

## Compromise response checklist

Jeśli podejrzewasz że jakiś sekret wyciekł (klucz w publicznym repo, klucz w logach SaaS, etc.):

1. **Natychmiast** rotate wszystkie secrety które mogły być w tym samym kontekście (cały `.env`
   zawsze rotujemy w całości, nie pojedyncze klucze).
2. **Zaraz potem** sprawdź historię gita (`git log --all -p -- .env` itp.) czy nie ma śladu
   commitnięcia sekretu.
3. Sprawdź Vercel Deployment Logs ostatnie 7 dni pod kątem nietypowych requestów.
4. Sprawdź Stripe Recent Activity pod kątem transakcji których nie znasz.
5. Sprawdź Neon Activity Log (Console → Settings → Activity) pod kątem nietypowych queries.
6. Jeśli klucz był w public commit: **wymuś rewrite historii** (`git filter-repo`) + powiadom
   GitHub Security żeby revoke detected token (czasem GitHub auto-revoke'uje znane tokeny).
7. Po pełnym rotate + audicie zostaw incident note w `docs/runbooks/incidents/<date>.md`
   (co się stało, co rotowane, czy są ślady abuse).

---

## Pre-launch full rotation

Przed otwarciem sklepu dla real klientów rotujemy **wszystko**, bo dev/prod long-lived
secrety mogły być widoczne na zrzutach, w logach Claude, etc. Patrz memory
[[pre-launch-secret-rotation]] dla pełnej listy + checklist.

Kolejność (od najmniej krytycznych do najbardziej):
1. Upstash token
2. SMTP password
3. R2 keys
4. Payload secret
5. Neon password
6. Stripe keys (jako ostatnie - są live-mode + już produkcyjne)
