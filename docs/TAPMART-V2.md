# TapMart V2 — the local marketing marketplace

TapMart V2 turns tapmart.live into a local marketing + creator + car
advertising marketplace on top of the original live link board (which keeps
working at `/`, `/l/*`, `/dashboard`, `/earn`, `/admin`).

The core loop: a business has a marketing need → TapMart turns it into an
opportunity → local people see it in their feed → creators, photographers and
drivers do the work and earn → the business gets content and exposure → it
spends again.

## One account, many capabilities

Every person has one account. Onboarding (`/onboarding`) asks what they're
here for — earn, grow a business, or both — and capabilities can be added any
time (creator profile, vehicles, businesses). Nothing forces separate
accounts.

## The app (`src/app/(v2)/`)

Signed-in navigation is the same five destinations on phone (bottom bar) and
desktop (left rail), plus a prominent **+ Create** sheet:

| Route | What it is |
| --- | --- |
| `/home` | Discovery feed: personalized opportunities, tabs (For You / Nearby / Highest Pay / New) and type filters. Deterministic ranking in `src/lib/v2/feed.ts` — freshness + pay + same-city + saved-business boosts. |
| `/jobs`, `/jobs/[id]` | Browse work and track "My Work". A campaign page adapts: creators apply/submit (with content-rights acknowledgement), the business reviews applications and submissions (approve & pay / revision / reject). |
| `/cars`, `/cars/new`, `/cars/[id]` | Car ads marketplace. Guided 4-angle vehicle capture, standardized ad zones with driver asking prices, business search, offer → counter → accept, booking workflow (creative → installation → active → completed) and proof-of-work uploads (photos, odometer). |
| `/alerts` | Notification feed with unread state and deep links. |
| `/me`, `/me/edit`, `/me/creator`, `/me/portfolio` | Profile hub, creator profile + verification request, portfolio. |
| `/u/[username]`, `/b/[slug]` | Public profiles for people and businesses. Never exposes addresses or verification data. |
| `/messages`, `/messages/[id]` | Conversations anchored to campaigns/offers/bookings, with system lines ("Offer accepted", "Submission uploaded"). |
| `/wallet` | Earnings (fee already deducted), marketing credit, payout requests. |
| `/business/*` | Command center: attention items, quick actions, marketing ideas with **Turn this into a campaign**, profile + brand kit, content calendar, connected accounts, review queue, car campaigns. |
| `/create` | One step-by-step wizard for every campaign/job type, with draft autosave and idea prefills. |
| `/search` | Global search across jobs, businesses, people, cars. |
| `/admin/market` | Trust center: creator/vehicle verification queues, payout processing, open reports, platform fee. |

## Money

Everything runs on the existing rails — no parallel payment system:

- Businesses top up **credit** via the existing Stripe checkout (`/dashboard`).
- Publishing a campaign requires enough credit to pay at least one approval.
- Approving a submission (or activating/paying a car-ad month) moves money in
  one transaction (`src/lib/v2/money.ts`): wallet debit + `credit_ledger`
  row + an `earnings` row for the worker, minus the platform fee.
- The platform fee (`platform_fee_pct`, default 15%) is an admin setting.
- Workers request payouts from `/wallet`; admins process them in
  `/admin/market` (reusing `payout_requests`).
- Balances are always computed server-side from the ledger.

## Database

Migration `supabase/migrations/0019_tapmart_v2.sql` adds the marketplace
domain: businesses + members, creator_profiles + portfolio_items, vehicles +
photos + zones, campaigns + applications + submissions, earnings, car_offers +
car_bookings + car_proofs, conversations + messages, notifications, follows +
saved_items + blocks, reviews, reports, connected_accounts, calendar_posts,
marketing_recommendations. Proper enums, FKs, indexes and RLS throughout;
authorization is enforced in server actions (`requireBusinessMember`,
conversation membership, ownership checks) — never by hiding buttons.

## External integrations

- **Claude (`ANTHROPIC_API_KEY`)** — marketing recommendations
  (`src/lib/v2/recommend.ts`) and the existing content agent. Falls back to a
  deterministic playbook when unset; either way ideas carry a campaign
  prefill.
- **Supabase Storage (`SUPABASE_SERVICE_ROLE_KEY`)** — media uploads via
  `/api/v2/upload` (organized folders: avatars, business, vehicles,
  campaigns, submissions, portfolio, proofs). Local dev falls back to
  `public/uploads/`.
- **Meta/TikTok/Google account connections** — architecture only:
  `connected_accounts` records honest states (disconnected/pending); nothing
  fakes "connected". Real OAuth needs platform app credentials.
- **Stripe** — already wired for credit top-ups (existing flow).

## Development

```
npm run dev                                  # dev server (dev auth shim available)
psql "$DATABASE_URL" -f supabase/migrations/0019_tapmart_v2.sql
psql "$DATABASE_URL" -f scripts/seed-v2.sql  # demo data, DEV ONLY, all names prefixed [demo]
npx vitest run                               # 62 tests incl. tests/v2-marketplace.test.ts
```

## What's live vs. waiting on credentials

Fully working now: onboarding, feed, campaigns end-to-end (create → submit →
approve → pay → review), car ads end-to-end (list → offer → counter → book →
proof → pay), messaging, notifications, wallet + payouts, business center,
calendar (plan/approve mode), search, admin trust center.

Waiting on credentials: social auto-posting + account connections (Meta,
TikTok, Google OAuth apps), AI-generated recommendations (better with
`ANTHROPIC_API_KEY`), production uploads (`SUPABASE_SERVICE_ROLE_KEY`).

## Sensible next priorities

1. Real geo distances (store lat/lng per city, order "Nearby" by distance).
2. Email/push notification delivery for the notification feed.
3. Meta OAuth for the connected-accounts flow once platform apps exist.
4. Business team invitations (schema `business_members` already supports roles).
5. Escrow-style budget reservation at campaign publish (schema ready).
