# TapMart V4: the media-first build

One account, two modes. Users find three ways to make money; businesses
subscribe and run the marketing that pays those users.

```
USER       Home · Activity · Earnings · Profile        Recreate · Story · Car
BUSINESS   Overview · Content · Create · Campaigns · Business   Essential · Growth
```

The screen rules every page follows are in `docs/design-rules.md`.

The two modes are two shells, not one shell with a switch:
`src/components/v2/UserShell.tsx` (Home, Activity, Earnings, Profile) and
`src/components/v2/BusinessShell.tsx` (Overview, Content, Create, Campaigns,
Business: a five-tab bottom bar on phones, a compact sidebar with one lime
Create button on wider screens). `src/app/(v2)/layout.tsx` picks one from the
active identity. They share auth, the account, notifications, messages, the
design tokens and the media components, and nothing else. The old board lives
at `/board` (also `/legacy`) and is not linked from the product.

## What changed in V4

| Area | Before | Now |
| --- | --- | --- |
| Home cards | Photo, four text rows, requirement line | The media is the card: 9:16 reference or creative with money and a one-line title on it, one meta row, one button |
| Recreate detail | Requirements list and a paragraph | Video, money, numbered visual steps with frames, rule chips, then the upload flow with progress and a requirement check |
| Profile | Rows | The car on stage (3D model, photo turntable, or a still), earning setup as rows, identity switch |
| Business overview | Cards | Attention items with the media they are about, three numbers, one trend, the next shoot |
| Trends | Marketing recommendations | Real trend providers (manual, curated, dev fixtures, an API placeholder) and an AI brief to campaign in one tap |
| Vehicles | Form plus photos | Guided eight-angle scan, quality check, recognition, an async reconstruction pipeline, a placement preview for businesses |
| Business services | Health score | Content shoots per plan, AI month planning, brand kit with approval, Google checks from the profile, growth from a connected account or manual entries |

## Systems and where they live

### Recreate loop (`src/lib/ai`, `src/lib/trends`)

`trend -> generateBrief -> campaign_briefs -> wizard (edit) -> campaign.details.brief + guide -> Home -> detail steps -> upload -> checkSubmission -> submission.meta.check -> business approval -> payMarketplaceWork`.

- `src/lib/ai/client.ts`: Anthropic SDK, model `claude-opus-5` (override with `AI_MODEL`), adaptive thinking. Every generator falls back to a deterministic template and labels the result `source: "template"` when `ANTHROPIC_API_KEY` is missing.
- `src/lib/ai/brief.ts`, `guide.ts`, `check.ts`, `briefs.ts`, `schedule.ts`.
- `src/lib/trends/*`: providers report `available()`; nothing invents views.
- Money is untouched: `payMarketplaceWork` in `src/lib/v2/money.ts` is still the only thing that moves credit, and only on business approval. The AI check is advisory.

### Smart vehicle (`src/lib/vehicles`, `src/lib/jobs.ts`)

See `docs/vehicles.md`. The scan UI is `src/app/(v2)/me/vehicles/scan`. The stage component (`src/components/v2/vehicle/VehicleStage.tsx`) shows the best honest level: GLB in three.js, else a drag turntable of the scan photos, else a still. Without a reconstruction provider the scan stops at `waiting_provider` and says so.

Jobs run from `/api/jobs/run` (cron every 5 minutes on Vercel with `CRON_SECRET`), or `/api/dev/jobs` and the `runScanNow` action in development.

### Business services (`src/lib/business`, `src/lib/google`, `src/lib/social`)

See `docs/business-services.md`. Shoots come from the plan allocation in `src/config/plans.ts`. Brand changes go suggestion, preview, approve. Google checks derive from the TapMart profile until Google OAuth is configured. Growth reads a connected Instagram account or manual snapshots, never estimates.

## Environment variables

| Variable | Used for | Without it |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Briefs, guides, checks, brand proposals, month plans, vehicle recognition | Templates and manual entry, labelled |
| `AI_MODEL` | Override the model id | `claude-opus-5` |
| `TREND_API_KEY` | A platform trend provider (not implemented) | Curated and manual trends |
| `VEHICLE_CATALOG_PROVIDER=vpic` | NHTSA vPIC catalog | Local seed catalog |
| `RECON_PROVIDER`, `RECON_API_URL`, `RECON_API_KEY` | 3D reconstruction | Scans wait at `waiting_provider` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google Business API | Profile-derived checks |
| `IG_ACCESS_TOKEN`, `IG_USER_ID` | Instagram insights and publishing | Manual snapshots, manual publishing |
| `META_APP_ID`, `META_APP_SECRET` | Creator Instagram OAuth | Manual handle entry |
| `STRIPE_*` | Credit top-ups and subscriptions | Dev top-up route, dev subscriptions |
| `CRON_SECRET` | Cron routes | Jobs only run from the dev route |

## Migrations and seeds

Migrations 0022 (recreate loop), 0023 (vehicle scans, jobs, catalog), 0024
(business services). Seeds, in order after `scripts/seed-v2.sql`:
`scripts/seed-v3-recreate.sql`, `scripts/seed-v3-business.sql`.

## Verifying

```
npx tsc --noEmit && npx eslint src tests --quiet && npx next build
DATABASE_URL=postgresql://app:app@127.0.0.1:5432/untitled npx vitest run
node .claude/skills/mobile-first-design/scripts/audit.mjs --base http://localhost:3000 --out ./mobile-audit --landscape --email demo-creator@example.test --password password123 /home /me /activity
```

Demo accounts in development: `demo-creator@example.test` and
`demo-owner@example.test`, password `password123`.
