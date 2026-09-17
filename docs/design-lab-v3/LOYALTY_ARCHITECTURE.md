# TapMart Loyalty: future production architecture

Recorded 2026-09-17 for the V3 Design Lab. This document describes the
production model Loyalty will need so that the V3 concept, the Business
experience, the public website and the attribution model are designed
around it now. Nothing here is migrated: there is no SQL, no Supabase
table, no route, no Wallet integration and no notification delivery in
this stage. The Design Lab simulates all of it with local fixture state.

Companion documents: WALLET_RESEARCH.md (what Apple Wallet and Google
Wallet support today) and REPORT.md (the concept deliverable).

## 1. What Loyalty is inside TapMart

TapMart gets a business attention (Recreate, Story, Car), turns that
attention into customers (a Wallet loyalty card joined from a campaign
link or a QR at the counter) and brings those customers back (visits,
points, rewards, Wallet updates). Loyalty is the third act. Its value to
the business is measured in three counts it can trust: joined, came back,
redeemed. Its value to TapMart is attribution: which campaign and which
creator produced repeat customers.

Product rules the architecture protects
- A business runs at most one active program in the MVP: visits (stamps)
  or points. Advanced tiers, coupons and enterprise features are later.
- Money shown is only money TapMart knows. Loyalty never shows revenue,
  average order value or "value generated" because TapMart has no
  verified transaction data. Counts only.
- The first known TapMart acquisition source of a member is preserved for
  life. Later touches never overwrite it.
- Creators never see customer identities. They see aggregate counts only.
- Every business-side message to members is a Wallet update. TapMart does
  not send SMS, email or app push to customers in the MVP and the interface
  never implies it.
- Event history is append-only; projections (progress, counts) are derived
  and rebuildable from events.

## 2. Entities

Naming follows the existing schema style (snake_case, `id uuid`,
`business_id`, `created_at`). Field lists are the recommended minimum; the
engineer who writes the migration decides types with the rest of the
schema in view.

### loyalty_programs

Purpose: one row per program a business creates. Holds the rule and the
card design.

Important fields
- id, business_id, status (draft, live, paused, archived)
- kind: `visits` or `points`
- rule: for visits `target_visits` (5); for points `points_per_visit` (1)
  and `target_points` (100). A `qualifying_note` ("Any purchase over
  US$5") is optional text shown on the card back and the signup page.
- reward_id (the current reward; see loyalty_rewards)
- card: `card_name` (business name as printed), `card_reward_title`,
  `card_bg_hex`, `card_fg_hex`, `card_label_hex`, `logo_asset_id`,
  `artwork_asset_id` (strip or hero image), `terms_text` (optional)
- join_code (short, unguessable, used in the signup URL and the business
  QR), signup_url derived
- wallet_apple_pass_type_id, wallet_google_class_id (null until issued)
- created_at, updated_at, launched_at

Relationships: business 1..n programs (MVP: one live); program 1..n
members; program 1..n rewards over time; program 1..n events.

MVP: kind, rule, one reward, card design, join code, status.
Future: schedules, multiple programs, location list for Wallet relevance,
multiple languages.

### loyalty_rewards

Purpose: the reward definition, versioned so an edit never rewrites the
history of what a member earned.

Important fields
- id, program_id, name ("Free drink"), requirement (target visits or
  points, copied from the program at creation so history is stable),
  terms (optional), active (bool), created_at, retired_at

Relationships: program 1..n rewards (one active). Member progress and
events reference the reward version that was active at the time.

MVP: one active reward per program; editing creates a new version.
Future: multiple concurrent rewards, choice rewards, time-limited rewards.

### loyalty_member_rewards

Purpose: an earned reward instance, distinct from the reward definition.
Editing a reward never rewrites what a member already earned, and a
second earned instance is another quantity of the same reward, not a tier.

Important fields
- id, member_id, program_id, reward_id (the definition version that was
  active when it was earned), unlock_event_id, consumed_credits (the
  visits or points this instance consumed), status (ready, redeemed,
  voided), redemption_event_id (nullable), earned_at, redeemed_at

Relationships: member 1..n instances; reward version 1..n instances;
each instance points at exactly one unlock event and at most one
redemption event.

Rules
- Progress beyond the requirement is retained toward the next instance;
  redeeming one instance consumes only that instance's credits.
- "Rewards ready" on the business overview counts ready instances;
  "Rewards redeemed" counts redemption events; attribution's "Redeemed"
  counts unique members with at least one redeemed instance. The three are
  different numbers and are labelled as such.

MVP: everything above. Future: expiry, choice rewards, transfers.

### loyalty_members

Purpose: a customer enrolled in one program. This is the customer
identity record and the privacy boundary. A member is unique per program
by normalised contact (a unique index on program_id and contact_normalised).

Important fields
- id, program_id, business_id (denormalised for row-level security)
- first_name (required), contact_kind (`phone` or `email`), contact
  (required, one of the two, normalised), contact_verified (bool; MVP does
  not verify)
- member_code (the value in the member QR; random, rotatable), joined_at
- status (active, blocked, deleted), consent_terms_version, consent_at
- attribution_id (the acquisition record; see loyalty_attribution)

Relationships: program 1..n members; member 1..1 progress; member 0..n
wallet passes; member 1..n events; member 1..1 attribution.

MVP: first name plus phone or email, member code, consent, attribution.
Future: optional birthday or preferences only if a reward needs them,
member merge across businesses (never by default), account link to a
TapMart user (never required).

### loyalty_member_progress

Purpose: the current projection for a member: what the card shows. Derived
from events, rebuildable, cached for speed.

Important fields
- member_id (pk), program_id
- visits_count or points_balance (per program kind), progress_toward
  (0..target), rewards_ready (integer), rewards_redeemed_total
- last_visit_at, visit_count_total (lifetime visits, including redeemed
  cycles), returned (bool: at least two visits on distinct days)
- wallet_state: `not_added`, `added_apple`, `added_google`, `added_both`
- updated_at, last_event_id

MVP: everything above.
Future: streaks, expiry of points, per-location counts.

### loyalty_events

Purpose: the append-only history. Every fact about a member starts here;
progress, dashboard counts and attribution funnels are views over this
table. Nothing is updated or deleted.

Important fields
- id, program_id, member_id, business_id
- type (enum below), occurred_at, recorded_at
- actor: `member` (self signup), `business_staff` (staff user id),
  `system` (wallet callbacks)
- payload (jsonb, small, per type: visit_delta, points_delta, reward_id,
  wallet_platform, message_id, source snapshot for signup)
- idempotency_key (for scanner double taps and retried requests; a
  duplicate key within a program produces no new event)
- business_day (the America/Chicago, or the business's own time zone,
  calendar day the event counts toward), counted (bool: whether the event
  advanced progress), delta (the visits or points actually applied),
  qualifying_visit_id (an identity shared by the VISIT or POINTS_ADDED
  event and the business day it consumed, so a positive POINTS_ADDED also
  contributes a qualifying visit day and points members can be measured
  as repeat visitors), staff_user_id for counter events

Event types
- SIGNUP: member created; payload carries the attribution snapshot.
- VISIT: one visit counted (visits programs).
- POINTS_ADDED: points_delta (points programs).
- REWARD_UNLOCKED: progress reached the requirement; reward_id.
- REWARD_REDEEMED: staff redeemed; reward_id; resets the cycle.
- WALLET_ADDED: a pass was saved; platform (apple, google).
- WALLET_UPDATED: a pass update was sent; kind (progress, reward_ready,
  redeemed, message); message_id when a business message.
- CAMPAIGN_CLICK: a click on a TapMart attribution link, recorded only
  when TapMart's link service already has a trustworthy click event; it
  is attached to a member only after SIGNUP resolves the session.
- Future: VISIT_REVERSED, POINTS_REVERSED (corrections as new events, not
  deletions), MEMBER_BLOCKED, PROGRAM_CHANGED.

Rules
- VISIT and POINTS_ADDED require a staff actor and an idempotency key;
  the same key within a program is a no-op.
- REWARD_UNLOCKED is emitted by the server when a VISIT or POINTS_ADDED
  crosses the requirement; staff never emit it directly.
- Two VISIT events for one member on the same calendar day (business time
  zone) are allowed but flagged in the payload (`same_day: true`); the
  business decides in program rules whether same-day visits count (MVP
  default: one visit per day counts; the second is recorded but does not
  advance progress, and the scanner says so).

### loyalty_attribution

Purpose: the acquisition record of a member: where they came from, frozen
at signup.

Important fields
- id, member_id (unique), program_id, business_id
- source_type: RECREATE, STORY, CAR, DIRECT_CREATOR_REQUEST, TAPMART_LINK,
  BUSINESS_QR, ORGANIC
- campaign_id (nullable), creator_id (nullable), link_id or qr_id
  (nullable: the specific link or code that was scanned or clicked)
- signup_at, first_touch_at (when the link was clicked, if known),
  session_id (the signup session that carried the parameters)
- confidence: `link` (the signup arrived through a creator or campaign
  specific link or QR), `declared` (the customer chose "How did you hear
  about us" and named a creator or campaign; future), `none` (shown to the
  business as "Source not tracked")
- link_code (the fixture or production link registry entry the signup came
  through); arbitrary URL parameters never grant attribution: only a
  registered link or QR code resolved server side does

Rules
- Written once at SIGNUP. Never updated by later visits, later clicks or
  later scans. A later touch is stored as an event, not as attribution.
- BUSINESS_QR means the customer scanned the counter code; ORGANIC means
  the signup page was reached with no TapMart parameters at all.
- Creator-specific links are the only way a creator gets credit. TapMart
  mints a link per creator per campaign when the campaign is accepted
  (Story: the link in the creative's sticker; Recreate: the link in the
  caption the business publishes; Car: the QR printed on the placement).

### wallet_pass_registrations

Purpose: Apple's device registrations for a pass (the web service's
registrations table): one row per device that asked for updates.

Important fields
- id, wallet_pass_id, device_library_id, push_token (secret), active,
  registered_at, unregistered_at

Rules: many devices per pass and many passes per device; delete when APNs
reports the token invalid. Google needs no equivalent: Google holds the
saved object.

### wallet_passes

Purpose: one row per pass issued to a member on a platform.

Important fields
- id, member_id, program_id, platform (apple, google)
- apple: pass_type_id, serial_number, authentication_token (secret),
  last_updated_tag; registrations are a child table
  (wallet_pass_registrations: device_library_id, push_token, active)
- google: object_id, class_id, save_jwt_issued_at
- status (save_opened, save_confirmed, removed, voided), save_opened_at,
  save_confirmed_at, removed_at. A save action opened (the button was
  tapped, the .pkpass or save link was served) is distinct from a save
  confirmed (Apple: the device registered; Google: the class callback or
  a later object read shows hasUsers).

MVP: none of this exists; the Design Lab only simulates "Added".
Future: the Apple pass web service (register, list serial numbers,
fetch pass, unregister, log) and the Google Wallet REST calls.

### wallet_updates

Purpose: what TapMart pushed to Wallet and why, so that the business can
see its updates and so that platform limits are enforced.

Important fields
- id, program_id, member_id (null for program-wide), platform
- kind: `progress`, `reward_ready`, `redeemed`, `message`
- title, body (business messages only), change_message (Apple only, only
  for time-critical kinds), notify (bool: Google notifyOnUpdate or
  TEXT_AND_NOTIFY)
- submitted_at, delivery_state (queued, submitted, accepted_by_platform,
  failed), platform_response, notification_requested (bool),
  notification_seen: never stored, because neither platform reports it.
  An update submitted is distinct from an update delivered; a
  notification requested is distinct from a notification seen. The
  interface never says Delivered or Read.

Rules
- Google: at most three notifying updates per pass per 24 hours (platform
  limit); TapMart product rule: one business message per program per day.
- Apple: change messages only for reward_ready and redeemed; a message
  kind updates the pass content without a change message.

### Supporting existing entities (unchanged)

campaigns, creators (users), businesses, the link or QR service, staff
users. Loyalty rows point at them; they do not change.

## 3. Attribution rules

1. When a customer arrives at a signup page through a TapMart link or QR,
   the signup session carries campaign_id, creator_id, source_type and the
   link_id. These live in the session (signed cookie or server session),
   never only in the URL that gets pasted around.
2. At SIGNUP the server writes loyalty_attribution once from the session.
   Without parameters the source is BUSINESS_QR (counter code) or ORGANIC
   (plain page).
3. Every later VISIT, REWARD_UNLOCKED and REWARD_REDEEMED for that member
   inherits the member's attribution by join, so the funnel Campaign ->
   Creator -> Signup -> First visit -> Repeat visit -> Reward -> Redemption
   is a query over loyalty_events joined to loyalty_attribution.
4. First known TapMart source wins. If the same customer scans a second
   creator's QR later, that is recorded as a CAMPAIGN_CLICK event and
   surfaced as "also reached through", never as a change of source.
5. Multi-touch attribution, if ever wanted, is a separate model built from
   the event history. The acquisition record stays single and immutable.
6. Deduplication: a member is unique per program by normalised contact.
   A second signup with the same contact returns the existing member and
   does not create a new attribution.

## 4. The funnel a business sees

Per creator or per campaign, all counts, no money:
- Joined: members whose attribution points at it.
- Came back: of those, members with `returned = true` (two visits on
  different days; the first visit after signup counts as visit one).
- Redeemed: of those, members with at least one REWARD_REDEEMED.

The business view shows the three numbers as a visual descent. A creator
view shows the same three numbers for their own links only.

## 5. Privacy model

Required customer data: first name; one contact (phone or email);
consent timestamp and terms version; the member code. That is all the MVP
collects. The contact exists so the customer can recover their card and
so the business can tell two "Sara"s apart at the counter; it is not used
for marketing by TapMart.

Optional: nothing in the MVP. Birthday, preferences and a full name are
future and only when a reward needs them, opt-in.

What the business sees: first name, the masked contact (last two digits or
the email domain), progress, visit history, join date, source (campaign
and creator name), Wallet state. Full contact only in an explicit
"Contact" action that is logged, and only if the customer consented to be
contacted by the business.

What creators see: counts only. Joined, came back, redeemed for their own
links, per campaign. No names, no contacts, no visit times, no member
list. The creator API never joins loyalty_members.

What TapMart staff see: the same as the business, gated by support roles,
logged.

Wallet: the pass carries first name, progress and the member code, and
the business's branding. Apple back fields and Google text modules hold
the reward terms. No contact details are printed on the pass.

Retention: a member can ask the business or TapMart to delete them; the
member row is anonymised (name and contact removed, member code rotated),
events are kept with the member_id for counts, attribution counts remain
aggregate. Blocking a member stops progress without deleting history.

Location: TapMart stores the business address for Wallet relevance only if
the business turns nearby reminders on. Customer location is never
collected.

## 6. Notifications and updates

- Progress changes (visit, points): a silent pass update on Apple; on
  Google a balance update with notifyOnUpdate on, which Google may show as
  a notification within its 3 per 24 hours limit.
- Reward ready and Reward redeemed: a pass update with an Apple change
  message ("Your reward is ready") and a Google balance update with
  notify.
- Business messages (special offer, new promotion, milestone): a Wallet
  update. On Google, addMessage with TEXT_AND_NOTIFY (counts toward the
  limit); on Apple, updated pass content without a change message. The
  business is told exactly this in the interface: "Wallet update. Apple
  Wallet shows it on the card; Google Wallet may notify. Once a day."
- Nothing else. No SMS, no email, no app push in the MVP.

## 7. Recording a visit

Counter flow: staff opens Loyalty, taps Add visit, scans the member QR
(camera) or searches by first name or contact, confirms the member, taps
+1 visit or the points amount; the server appends VISIT or POINTS_ADDED
with an idempotency key from the scanner session; progress is recomputed;
if the requirement is crossed, REWARD_UNLOCKED is appended and the reward
becomes redeemable; Redeem appends REWARD_REDEEMED and starts a new cycle;
Wallet updates are queued after each event.

No POS integration in the MVP. Staff identity is the logged-in business
team member; a single-purpose "counter mode" PIN is a later feature.

## 8. MVP versus later

MVP (this concept, then a production stage after approval)
- One live program per business: visits or points.
- One active reward, versioned on edit.
- Card design: logo, business name, colours, artwork, reward title, terms.
- Signup page from a business QR or a TapMart attribution link; first name
  plus phone or email; consent.
- Add to Apple Wallet and Add to Google Wallet from the signup page
  (production requires the issuer setup in WALLET_RESEARCH.md).
- Member list, member detail, progress, add visit or points, redeem.
- Attribution record at signup, the joined / came back / redeemed funnel
  per campaign and per creator, counts only.
- Business messages as Wallet updates, one per day.
- Loyalty counts on the Business Home and the Loyalty home.

Later
- Multiple programs, tiers, coupons, time-limited rewards, choice rewards.
- Counter PIN mode, multiple locations, per-location counts.
- Nearby Wallet reminders (needs business location and opt-in).
- Reversals and corrections UI (events exist for it).
- Declared attribution ("How did you hear about us").
- Multi-touch attribution views.
- Verified contact (one-time code) and card recovery by contact.
- Creator analytics page with the aggregate funnel.
- POS or Smart Tap integration.
- Revenue, only if verified transaction data ever exists.

## 9. What the Design Lab simulates

Local fixture state only (React state seeded from fixtures, reset on
reload): member signup, adding visits and points, reward unlock,
redemption, "Added to Apple Wallet" and "Added to Google Wallet" as
simulated actions, Wallet updates, campaign attribution. Nothing is
persisted, signed, issued or sent.
