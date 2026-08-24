# TapMart

**What's getting clicked right now?**

Official production site: **https://topmart.live** (yes — the brand is
*TapMart*, the domain is *topmart.live*; that is intentional).

TapMart is a live marketplace for attention: a board where links — shops,
projects, creators, apps, launches, anything with a URL — compete to be
discovered. Add your link, add credit, get seen. One link owns **The Spot** for
sixty seconds at a time; the three biggest backers of the day hold **Top 3**;
everyone else ranks on **The Board**; up to a hundred live links stream through
**The Bar** at the bottom of every page. Creators share the site and **Earn**
from the qualified traffic they send.

The public product is deliberately simple. The machinery under it is not.

> The name, tagline, domain, and metadata all live in
> [`src/config/site.ts`](src/config/site.ts) — brand and domain changes are a
> one-file edit. Internal identifiers (cookie names, database names, the
> repository/Vercel project name `marketing-app`) intentionally keep their old
> spellings; renaming them would risk sessions and deployments for zero public
> benefit.

## How the money works

- All amounts are **integer cents**. There is no floating-point money anywhere.
- Users buy **credit** through Stripe Checkout (test mode in development).
  Credit is granted **only** by the verified Stripe webhook, never by the
  success redirect, and the grant is idempotent — a replayed webhook cannot
  double-credit (`apply_stripe_topup` claims the Checkout session id with a
  unique constraint).
- Credit is *allocated* from the wallet onto placements (Board / Spot / Bar).
  Allocation moves money; it does not spend it. Each placement keeps its own
  remaining balance.
- A **qualified outbound open** is the only thing that consumes credit. The
  debit happens inside a single SQL function (`record_click`) that locks the
  wallet and placement, re-checks the balance, and refuses to go below zero
  under any concurrency.
- Every movement is a row in the append-only **`credit_ledger`** with balance
  before/after. The wallet's cached total is a performance convenience; the
  ledger is the record.

### The Board scoring invariant

**Board rank is decided by credit *added to the Board during the current daily
round* — never by what remains.** These are two separate columns:

| | `board_round_entries.score_cents` | `placements.remaining_credit_cents` |
|---|---|---|
| Add $50 to Board | 5000 | 5000 |
| 980 opens at 5¢ | **5000 (unchanged)** | 100 |
| Add $20 more | 7000 | 2100 |
| Daily reset | **0** (new round) | 2100 (money survives) |

A #1 link with one cent of remaining credit is still #1. At exactly $0
remaining the placement goes inactive and off the board, its score preserved in
round history. Ties after a reset break by previous-round rank, then activation
time, then id. Qualified clicks **never** touch `score_cents` — this is
enforced in the SQL and pinned by tests.

### Click qualification

Every paid open leaves through `/go/[placementId]`, which decides — server-side,
before redirecting — whether the click is billable:

- real GET from a real browser (bot user agents, missing UA → not billed)
- not a prefetch or link preview (`Sec-Purpose`, `Purpose`, `X-moz` honoured)
- placement live, link approved and enabled, balance covers the price
- not the owner clicking their own link
- not a repeat from the same visitor for the same canonical link inside the
  duplicate window (default 24 h)
- under the per-visitor rate limit

Unqualified clicks are recorded with a rejection reason and redirect anyway —
visitors are never punished, they are simply not billed. Visitor identity is a
first-party anonymous cookie plus a keyed HMAC of the IP; raw IPs are never
stored and there is no fingerprinting.

### Creator attribution

`/s/[code]` opens a referral session for the visitor (last touch wins, 30-day
window) and forwards them on. When a referred visitor later makes a qualified
open, the creator earns the configured commission (default 1¢ of the 5¢ click)
— exactly once per click, enforced by a unique constraint on the click event.
Earnings sit `pending` through a fraud hold (default 7 days), then become
`available`; payouts are requested manually and reviewed by an admin. No payout
rail is wired in V1 (the architecture leaves room for Stripe Connect).

## Stack

- **Next.js** (App Router, Server Components + Server Actions) · TypeScript · Tailwind v4
- **Supabase**: Postgres, Auth (email + password accounts), Storage (artwork uploads)
- **Stripe** Checkout + webhook, test mode
- **Vercel** hosting + cron
- Tests: **Vitest** against a real Postgres

Application queries go straight to Postgres over the pooled connection string
(the money logic lives in SQL functions that need real transactions). RLS is
enabled on every table regardless, so nothing reachable with a user JWT can see
another user's balances — and public views (`public_board`, `public_bar`,
`public_spot`) never expose a placement's remaining credit.

## Local development

```bash
# 1. Postgres (any local instance works)
createdb untitled            # role/password in .env.example
cp .env.example .env.local   # fill DATABASE_URL, AUTH_SECRET, CLICK_HASH_SECRET
                             # set AUTH_DEV_MODE=true to sign in without email

# 2. Schema + seed
npm install
npm run db:reset             # applies supabase/local + supabase/migrations
npm run seed                 # 28 polished dev links, three test accounts

# 3. Run
npm run dev
```

Dev accounts after seeding (password `password123` signs any email in while
`AUTH_DEV_MODE=true`):
`owner@untitled.test` (owns every seeded link) · `creator@untitled.test`
(referral earnings) · `admin@untitled.test` (admin at `/admin`).

The seed script refuses to run against a non-local database unless
`SEED_ALLOW_REMOTE=true` — development data must never masquerade as
production activity.

### Tests

```bash
npm test          # 56 tests; needs local Postgres (creates untitled_test)
npm run typecheck
npm run lint
npm run build
```

The suite pins the §64–§73 product requirements: board score never falling,
top-ups raising score, reset preserving money, exhaustion delisting, duplicate
suppression, creator paying exactly once, **concurrent clicks never
overspending**, **Stripe webhook replays crediting exactly once**, spot
scheduling spread, and bar capacity + queue promotion.

## Supabase setup (production)

1. Create a project at supabase.com.
2. Apply migrations: `supabase link --project-ref <ref>` then `supabase db push`
   (or run the files in `supabase/migrations/` in order via the SQL editor —
   **skip `supabase/local/`**, which is the local-only auth shim).
3. Auth → enable Email provider (password sign-in). Storage → create a public
   bucket `link-images`.
4. Copy into your deployment env: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only),
   and set `DATABASE_URL` to the **connection pooler** URI.
5. **Auth → URL Configuration** must know every domain the app runs on, or
   verification/reset emails will land on dead links:
   - Site URL: `https://topmart.live`
   - Redirect URLs: `https://topmart.live/**` — plus
     `https://<project>.vercel.app/**` while that alias is still in use, and
     `http://localhost:3000/**` for local development.

   The app builds those links from `SITE_URL` in `src/config/site.ts`
   (overridable per-environment with `NEXT_PUBLIC_SITE_URL`; local dev
   automatically uses `http://localhost:3000`).

## Stripe setup

1. Test-mode keys → `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
2. Webhook endpoint `https://<domain>/api/stripe/webhook` subscribed to
   `checkout.session.completed`; its signing secret → `STRIPE_WEBHOOK_SECRET`.
3. Locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

Money flow: Checkout session → webhook verifies signature → `apply_stripe_topup`
(idempotent) → optional immediate allocation from the session's metadata.

## Vercel deployment

1. Import the repo; framework auto-detects. (The Vercel project may keep its
   internal name `marketing-app` — only the public domain matters.)
2. Set every variable from `.env.example` (leave `AUTH_DEV_MODE` unset).
3. `vercel.json` already schedules `/api/cron` every 10 minutes — it closes
   expired rounds, schedules the Spot day, resyncs the Bar, and releases
   creator earnings past their hold. Set `CRON_SECRET` to protect it.
4. **Custom domain**: add `topmart.live` (and `www.topmart.live`) under
   Project → Settings → Domains, with the apex as the primary domain so `www`
   redirects to it. Point DNS at Vercel (A `76.76.21.21` for the apex, CNAME
   `cname.vercel-dns.com` for `www` — the Domains screen shows the current
   records). Preview deployments keep their generated URLs; production
   canonical URLs, share links, and auth emails all use `https://topmart.live`
   via `src/config/site.ts`.

## Repository map

```
supabase/migrations/   schema, settings, money functions, click/spot/bar, RLS
supabase/local/        auth-shim so migrations run on plain Postgres (never deploy)
src/config/site.ts     name, tagline, domain, metadata — the brand point
src/lib/               db pool, auth, settings, validation, rate limit, click prequal
src/app/               routes: / board add dashboard earn admin l/[slug] go s api
src/components/        Spot, TopThree, Board, Bar, countdowns, header/footer
scripts/               db-reset, seed, browser verification sweep
tests/                 money + placement + validation suites
```
