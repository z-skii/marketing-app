# TapMart V3: one account, two modes

Tapmart connects businesses with regular people who spread their marketing.
This document is the map of how the product is organized and where each
piece lives in the code.

## The shape of the product

| | User mode | Business mode |
| --- | --- | --- |
| Feels like | An earning marketplace | A marketing command center |
| Navigation | Home · Activity · Earnings · Profile | Overview · Content · Create · Campaigns · Business |
| Home | Ways to make money (all three types mixed) | What needs my attention |

One login. A person is always themselves (User mode) and may also act as any
business they belong to (Business mode). The active identity is stored in
`profiles.active_business_id`; switching lives on Profile ("Use TapMart as").

### Three ways to earn (= three campaign types)

| Kind | A person... | A business... |
| --- | --- | --- |
| `recreate_reel` | recreates a reference video and uploads it | reviews and approves, paying per approved video |
| `instagram_story` | posts a ready-made Story, keeps it live, sends proof | checks the proof and approves |
| `car_ads` | applies with a car; drives with the artwork | accepts drivers; the booking runs monthly |

All three are rows in `campaigns` with `kind` and type-specific facts in
`campaigns.details` (jsonb). Legacy kinds (photography, videography, content,
general) keep their rows but never appear in the marketplace.

### Two plans

Essential and Growth (`src/config/plans.ts`, prices in app settings
`plan_essential_cents` / `plan_growth_cents`). Subscriptions are separate
from campaign spend: the plan is a monthly fee, campaign budgets are funded
from campaign credit (the wallet) and go to the people who do the work.

## Routes

User mode
- `/home` marketplace (`?f=for_you|nearby|recreate|stories|cars|top_pay`)
- `/o/[id]` one opportunity (layout by kind, participation flows)
- `/activity` Active · Submitted · Completed · Saved
- `/earnings` Available · Pending · Lifetime, history, payout requests
- `/me` earning identity, earning setup (Instagram, vehicle, payout), identity switcher
- `/me/settings`, `/me/edit`, `/me/instagram`, `/me/vehicles`, `/me/vehicles/new`, `/me/vehicles/[id]`

Business mode
- `/business` overview · `/business/create` (+ `/recreate`, `/story`, `/car`)
- `/business/campaigns`, `/business/campaigns/[id]`
- `/business/content` (calendar), `/business/plan`, `/business/billing`
- `/business/settings` (hub), `/business/edit`, `/business/connections`, `/business/health`, `/business/trends`

Shared: `/messages`, `/alerts`, `/search`, `/b/[slug]`, `/u/[username]`, `/onboarding`, auth pages.

Legacy (quarantined, out of navigation): `/board`, `/dashboard`, `/earn`, `/add`, `/l/*`, `/x/*`, `/s/*`, `/go/*`.
Old V2 routes (`/jobs`, `/cars`, `/create`, `/wallet`, `/business/calendar|review|car-ads`) redirect.

## Code map

- `src/lib/v2/core.ts` identity and mode (`getV2Context`, `requireBusinessContext`, `setActiveBusiness`)
- `src/lib/v2/opportunities.ts` the feed, one opportunity, activity, vehicles and car qualification
- `src/lib/v2/instagram.ts` the Instagram boundary: manual today, API later, never pretended
- `src/lib/v2/subscriptions.ts` plans, Stripe subscription checkout, dev activation
- `src/lib/v2/money.ts` the only place money moves (ledger-backed)
- `src/app/(v2)/o/actions.ts` Story participation and proof, car applications and acceptance
- `src/app/(v2)/business/create/actions.ts` creating the three campaign types
- `src/components/v2/EarnCards.tsx` the three card anatomies
- `src/components/v2/AppShell.tsx` the two navigations

## Honest states

- Instagram: handles and follower counts are entered by the person and
  checked manually until a Graph API connection exists (`isInstagramApiConfigured`).
- Story verification: the business reviews the screenshot and story link.
- Payouts: requested by the person, sent manually by TapMart (admin).
- Subscriptions: real billing only when Stripe subscription prices are
  configured; otherwise the plan page says so (development activation exists
  in dev mode only).

## Database

Migrations `0020_v3_campaign_kinds.sql` (enum values) and `0021_v3_modes.sql`
(details, vehicle applications, story proof meta, `social_accounts`,
`business_subscriptions`, `profiles.active_business_id`, business
verification, trends). Apply with `scripts/db-reset.sh` locally or
`scripts/apply-prod-migration.mjs` in production (0020 first, then 0021).
Seed for development: `scripts/seed-v2.sql`.
