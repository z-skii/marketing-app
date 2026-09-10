# Business services

The subscription side of TapMart: what a business gets each month, where
the code lives, and what is real today versus what needs credentials that
are not configured yet. Nothing in these modules invents Google, Instagram
or analytics numbers. Every UI-facing result carries a `source`:

| source | meaning |
| --- | --- |
| `manual` | the business typed it in |
| `api` | a provider API reported it (only when credentials and a connected account exist) |
| `template` | a deterministic template wrote it (no `ANTHROPIC_API_KEY`) |
| `ai` | Claude wrote it (`ANTHROPIC_API_KEY` set; model `claude-opus-5`, override with `AI_MODEL`) |
| `profile` | Google checks derived from the business row itself |
| `unavailable` | there is no data at all |

## Modules

| Area | Module | Notes |
| --- | --- | --- |
| Plans and allocations | `src/config/plans.ts` | `shoots` per plan: Essential 1 shoot / 10 photos / 3 videos, Growth 2 / 20 / 6. Prices stay in settings. |
| Brand kit | `src/lib/business/brand.ts` | `getBrandKit`, `proposeBrandKit`, `approveBrandKit`, `discardProposal`. A proposal never changes the kit in use; approval also mirrors palette and logo into `businesses.brand`. |
| Content shoots | `src/lib/business/shoots.ts` | `ensureMonthlyShoots` (idempotent, plan aware, 18th of the month or next available day), `getNextShoot`, `listShoots`, `addDeliverables`, `setShootStatus`, `assignShootTo`. |
| Month proposal | `src/lib/ai/schedule.ts` | `proposeMonth` (12 drafts, 4 reels / 4 photos / 4 stories, Mon/Wed/Fri 11:00 local, `BUSINESS_TIMEZONE`, default America/New_York), `approveAll`, `moveCalendarPost`. Thumbnails only from media the business already has. |
| Publishing | `src/lib/business/publishing.ts` | `PublishState`, `publishProviderStatus`, `manualPublishInstructions`. |
| Google Business | `src/lib/google/business.ts` | `profileProvider` (always), `apiProvider` (gated, not implemented), `runGoogleHealth`. |
| Growth analytics | `src/lib/social/insights.ts` | `instagramApi` (gated, real Graph calls), `manualSnapshots`, `getGrowthSummary`, `addManualSnapshot`. |
| Server actions | `src/app/(v2)/business/brand/actions.ts`, `src/app/(v2)/business/content/schedule-actions.ts`, `src/app/(v2)/business/health/actions.ts` | All use `requireBusinessContext`. |
| Admin fulfilment | `src/app/admin/market/shoot-actions.ts` | `assignShoot`, `setShootStatusAction`, `addShootDeliverables`; admin only. |
| Schema | `supabase/migrations/0024_business_services.sql` | `content_shoots`, `brand_kits`, `social_snapshots`, `google_health_checks`; `calendar_posts` gains `source`, `format`, `thumbnail_url`, `caption`, `recommended_time`. |
| Seed | `scripts/seed-v3-business.sql` | Demo Coffee Co.: one planned shoot, an approved kit, six template posts. Idempotent. |
| Tests | `tests/business-services.test.ts` | Template paths only; never touches the network. |

## Publishing states

`calendar_posts.status` (the existing enum) maps onto `PublishState`:

| calendar_posts.status | PublishState |
| --- | --- |
| idea, draft | draft |
| needs_approval | ready |
| approved | approved |
| scheduled | scheduled |
| (in flight) | publishing |
| published | published |
| failed | failed |

Auto-publishing is possible only when both are true: the server has
provider credentials and the business's `connected_accounts` row for that
provider is `connected`. Today only Instagram has a publishing client
(`src/lib/meta-publish.ts`, `IG_ACCESS_TOKEN` + `IG_USER_ID`), and those are
a single server account, not per business. Everything else is manual and
`manualPublishInstructions` says exactly what to do.

## What real OAuth per provider needs

None of this is built. `requestConnection` records a `pending` row so the
product can show an honest "waiting" state. To make a connection real:

### Instagram and Facebook (Meta)

- A Meta developer app with Facebook Login for Business and the
  `instagram_basic`, `instagram_content_publish`, `instagram_manage_insights`,
  `pages_show_list`, `pages_read_engagement` permissions (App Review needed).
- Env: `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`
  (`https://<site>/api/oauth/meta/callback`).
- Flow: redirect to `https://www.facebook.com/v21.0/dialog/oauth`, exchange
  the code for a user token, exchange for a long-lived token, list Pages
  (`/me/accounts`), read the Page's `instagram_business_account`, store the
  Page token and IG user id per business (encrypted) in `connected_accounts`.
- Publishing then uses the per-business token in place of `IG_ACCESS_TOKEN`
  in `src/lib/meta-publish.ts`; insights use it in `src/lib/social/insights.ts`.

### TikTok

- A TikTok for Developers app with Login Kit and Content Posting API,
  scopes `user.info.basic`, `video.publish`, `video.list`.
- Env: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI`.
- Flow: `https://www.tiktok.com/v2/auth/authorize/`, exchange at
  `https://open.tiktokapis.com/v2/oauth/token/`, refresh tokens every 24h.
  Content posting is a two-step init and upload; unaudited apps can only
  post privately.

### Google Business Profile

- A Google Cloud project with the Business Profile APIs enabled (access is
  by application) and an OAuth client (web).
- Env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
  (`https://<site>/api/oauth/google/callback`).
- Scope: `https://www.googleapis.com/auth/business.manage`.
- Flow: standard OAuth with `access_type=offline`, store the refresh token
  per business, list accounts and locations
  (`mybusinessaccountmanagement`, `mybusinessbusinessinformation`), read the
  location (hours, phone, website, categories, photos) and feed it to
  `apiProvider.fetchProfile` in `src/lib/google/business.ts`, which currently
  throws "not implemented in this environment".

### Anthropic

- `ANTHROPIC_API_KEY` turns on the `ai` source for brand proposals and month
  plans. `AI_MODEL` overrides `claude-opus-5`. Without the key every path
  uses templates and says so.

## Fulfilment of shoots

A business never books a photographer itself. `ensureMonthlyShoots` puts
the month's planned shoots on the calendar; an admin assigns a person
(`assignShoot`, platform member or a label for someone outside), marks
status, and attaches the delivered files. Business members can see shoots
and deliverables but cannot change status.
