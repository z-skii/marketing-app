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
| `unavailable` | there is no data at all |

There is no `profile` source any more: Google checks come only from the
Business Profile API on a connected account. Before a connection the
Google product shows one thing, the Connect button.

## Modules

| Area | Module | Notes |
| --- | --- | --- |
| Plans and allocations | `src/config/plans.ts` | `shoots` per plan: Essential 1 shoot / 10 photos / 3 videos, Growth 2 / 20 / 6. Prices stay in settings. |
| Brand kit | `src/lib/business/brand.ts` | `getBrandKit`, `researchBrand`, `proposeBrandKit`, `approveBrandKit`, `discardProposal`. Research gathers only real sources (see below); a proposal never changes the kit in use; approval also mirrors palette and logo into `businesses.brand`. |
| OAuth state | `src/lib/oauth/state.ts` | `createState` (32 random bytes in `oauth_states`), `consumeState` (single use, 15 minute expiry), `callbackBase`, `fetchWithTimeout`. |
| Google OAuth and API | `src/lib/google/oauth.ts` | `googleAuthUrl`, `exchangeCode`, `refreshAccessToken`, `listAccountsAndLocations`, `fetchLocation`, `listReviews`, `fetchMediaSummary`, `patchLocation`, `withGoogleToken` (auto refresh, marks "Needs reconnect" on failure), `selectGoogleLocation`, `disconnectGoogle`. |
| Google fixes | `src/lib/google/fixes.ts` | `fixesFrom` (Current, Proposed, `canApply`, reason and deep link), `applyFix` (PATCH through the Business Information API, never automatic). |
| Google summary | `src/lib/google/summary.ts` | `getGoogleSummary` with the connection state; no score or issues before a connection. |
| Meta helpers | `src/lib/social/meta.ts` | Facebook Login for Business: `metaAuthUrl`, `exchangeMetaCode`, `exchangeLongLivedToken`, `listPages`, `fetchInstagramProfile`, `fetchInstagramMedia`, `completeInstagramLogin`. |
| Business Instagram | `src/lib/social/instagram-business.ts` | `connectInstagramBusiness`, `syncInstagramBusiness` (profile, media, follower history, writes `social_snapshots` rows with source `api`), `disconnectInstagramBusiness`. |
| Person's Instagram | `src/lib/v2/instagram.ts` | `getInstagramForProfile`, `connectInstagramManually` (pending until an admin confirms), `connectInstagramViaApi`, `confirmInstagramManually`, `disconnectInstagram`, `meetsFollowerRequirement` (connected rows only). |
| OAuth routes | `src/app/api/oauth/{google,instagram,instagram-user}/{start,callback}` | Start requires the signed-in owner or manager (business routes) and creates a state; callback consumes it, exchanges the code, stores the row and redirects with `?error=` on any failure. |
| Screens | `src/app/(v2)/business/settings/connections`, `.../google`, `.../social`, `.../brand`, `src/app/(v2)/me/instagram` | Connections (one row per provider, five states), the Google check and Fix Google, Instagram insights, brand research, a person's Instagram. |
| Content shoots | `src/lib/business/shoots.ts` | `ensureMonthlyShoots` (idempotent, plan aware, 18th of the month or next available day), `getNextShoot`, `listShoots`, `addDeliverables`, `setShootStatus`, `assignShootTo`. |
| Month proposal | `src/lib/ai/schedule.ts` | `proposeMonth` (12 drafts, 4 reels / 4 photos / 4 stories, Mon/Wed/Fri 11:00 local, `BUSINESS_TIMEZONE`, default America/New_York), `approveAll`, `moveCalendarPost`. Thumbnails only from media the business already has. |
| Publishing | `src/lib/business/publishing.ts` | `PublishState`, `publishProviderStatus`, `manualPublishInstructions`. |
| Google Business | `src/lib/google/business.ts` | `apiProvider` (the only provider), `runGoogleHealth` (throws `NotConnectedError` without a connection), `getLastGoogleHealth` (null unless connected), `evaluateGoogleProfile` (checks carry `source: "api"` and `observed`). |
| Growth analytics | `src/lib/social/insights.ts` | `instagramApi` (the business's own token from `connected_accounts`, real Graph calls), `manualSnapshots`, `getGrowthSummary`, `addManualSnapshot`. |
| Server actions | `src/app/(v2)/business/brand/actions.ts`, `src/app/(v2)/business/content/schedule-actions.ts`, `src/app/(v2)/business/health/actions.ts` | All use `requireBusinessContext`. |
| Admin fulfilment | `src/app/admin/market/shoot-actions.ts` | `assignShoot`, `setShootStatusAction`, `addShootDeliverables`; admin only. |
| Schema | `supabase/migrations/0024_business_services.sql`, `0025_business_marketplace.sql` | `content_shoots`, `brand_kits` (+ `research`, `existing_signals`, `researched_at`), `social_snapshots`, `google_health_checks`; `connected_accounts` and `social_accounts` gain tokens, `external_id`, `avatar_url`, `meta`, `last_error`, `last_synced_at`; `oauth_states`. |
| Seed | `scripts/seed-v3-business.sql` | Demo Coffee Co.: one planned shoot, an approved kit, six template posts. Idempotent. |
| Tests | `tests/business-services.test.ts`, `tests/connections.test.ts` | Template paths only; Google and Meta are mocked with `fetch` stubs, never reached. |

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

## Provider connections

Every provider row in `connected_accounts` (business) or `social_accounts`
(person) maps onto five states the screens show as they are:

| row | state |
| --- | --- |
| no row, or `status = disconnected` | Not connected |
| `status = pending` | Connecting (Google: a location still has to be picked; a person's manual handle: waiting for an admin) |
| `status = connected` | Connected |
| `status = error`, `last_error = "Needs reconnect"` | Needs reconnect (a refresh or an API call came back 401) |
| `status = error`, any other `last_error` | Error, with the message |

Without credentials the Connect button is disabled and the row says
"TapMart's Google connection is not configured yet. Ask support to enable
it." (same sentence for Instagram). The pipeline is complete and tested, so
it works the moment the env vars exist.

### Env vars

| var | used for |
| --- | --- |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth client (web). |
| `GOOGLE_REDIRECT_BASE` | Optional. Origin for `/api/oauth/google/callback`. Falls back to `NEXT_PUBLIC_SITE_URL`, then the origin of the request that started the flow. |
| `META_APP_ID`, `META_APP_SECRET` | Meta app with Facebook Login for Business. |
| `META_REDIRECT_BASE` | Optional, same rule as above for `/api/oauth/instagram/callback` and `/api/oauth/instagram-user/callback`. |
| `NEXT_PUBLIC_SITE_URL` | Shared fallback for both callback origins. |

Register the callback URLs on the provider side:
`<base>/api/oauth/google/callback`, `<base>/api/oauth/instagram/callback`
and `<base>/api/oauth/instagram-user/callback`.

### Google Business Profile

1. `GET /api/oauth/google/start`: owner or manager of the active business,
   a state row, then Google's consent screen with scope
   `https://www.googleapis.com/auth/business.manage`, `access_type=offline`,
   `prompt=consent`.
2. `GET /api/oauth/google/callback`: consume the state, exchange the code at
   `oauth2.googleapis.com/token` (10 s timeout), store tokens with status
   `pending` and `source = oauth`, list accounts
   (`mybusinessaccountmanagement`) and locations
   (`mybusinessbusinessinformation`, read mask name, title, address, phone,
   website, hours, categories, profile, metadata) into `meta.locations`.
   One location is picked on the spot; several go to
   `/business/settings/connections/google` to choose. Any failure sets
   status `error` with `last_error` and redirects with `?error=`.
3. Picking a location sets `meta.location`, status `connected`,
   `connected_at`, and runs the first check.
4. `withGoogleToken` refreshes the access token when `token_expires_at` is
   within a minute; a failed refresh (or a 401) marks the row
   "Needs reconnect".
5. `apiProvider.fetchProfile` reads the location, its reviews
   (`mybusiness.googleapis.com/v4`, tolerant of 403/404: recorded as a
   reason, never invented) and its media count, and stores the snapshot in
   `meta.profile` with `last_synced_at`. `runGoogleHealth` evaluates that
   snapshot and stores the run with `source = api`; each check carries
   `observed`, the raw value from Google. Review and photo checks only
   exist when Google allowed those reads.
6. Fix Google: hours, phone, website and description can be PATCHed
   (`locations/{id}?updateMask=...`) after a person taps Approve change.
   Name, address, categories, photos and reviews cannot be changed through
   this API; those rows say so and deep link to the listing.
7. Disconnect deletes tokens, clears `meta`, and deletes every
   `google_health_checks` row for the business.

### Instagram (business)

1. `GET /api/oauth/instagram/start`: state row, then
   `https://www.facebook.com/v19.0/dialog/oauth` with scopes
   `instagram_basic`, `instagram_manage_insights`, `pages_show_list`,
   `pages_read_engagement`.
2. Callback: code to user token, long-lived token exchange, `/me/accounts`,
   the first Page with an `instagram_business_account`, then that account's
   `username`, `profile_picture_url`, `followers_count`, `media_count` and
   12 recent media. Stored as `external_id`, `external_name`,
   `avatar_url`, `meta { followers, media_count, media, history }`, status
   `connected`, `source = oauth`.
3. `syncInstagramBusiness` refreshes the same fields, appends today's
   follower count to `meta.history`, and writes the period's `social_snapshots`
   row with source `api` (follower change is a real difference between two
   readings; nothing is estimated). An expired token or a 401 marks
   "Needs reconnect".
4. Growth on the Instagram insights screen comes from `instagramApi`
   (reach, views, engagement from `/insights` with the business's token) or
   from the stored snapshots; manual numbers stay labelled "Entered by you".

Facebook and TikTok appear on the Connections screen as "Not available yet"
with no button; nothing pretends to connect them.

### Instagram (person)

- Manual: the person adds a handle. The row is `pending`, `verified_by =
  manual`, and no follower count is shown anywhere (`followers` is null in
  `getInstagramForProfile`, `meetsFollowerRequirement` fails) until an admin
  confirms it, which sets `connected`.
- OAuth: `/api/oauth/instagram-user/start` (carries `?return=`) and its
  callback use the same Meta helpers and upsert `social_accounts` with
  `external_id`, `avatar_url`, `follower_count`, `verified_by = api`,
  `status = connected`, `meta.media`.

## Brand research

`researchBrand(businessId, { photoUrls })` refuses with "Connect Instagram
or Google, or add your website or logo, so there is something real to
research." when no source exists. Otherwise it gathers only what is real:

| source | what is read | stored in `brand_kits.research.sources` |
| --- | --- | --- |
| Instagram | `connected_accounts.meta.media` (captions, thumbnails) and the profile | `used` or `not_connected` |
| Google | `connected_accounts.meta.profile` (name, category, description) | `used` or `not_connected` |
| Website | one page, 6 s timeout: title, meta description, og:image, theme-color, icon, up to 6 img src, hex colours used 3+ times in inline styles, font families | `used`, `missing`, or `failed` with the reason (an HTTP status, a timeout, unreachable) |
| Logo | `businesses.logo_url`. `sharp` is not a dependency, so colours are not read and the note says "Colors could not be read from the logo." | `used` or `missing` |
| Photos | uploads passed in | `used` or `missing` |

`existing_signals` holds colours in use, fonts detected, 3 to 5 tone words
(the model when `ANTHROPIC_API_KEY` is set, heuristics otherwise, labelled
`tone_source`), a photo style note and the real images looked at. The
proposal is then written by `proposeBrandKit` (source `ai` or `template`)
from those signals. An approved kit is never replaced without approval;
"Keep mine" discards the proposal.

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
