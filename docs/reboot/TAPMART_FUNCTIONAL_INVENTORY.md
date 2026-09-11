# TapMart functional inventory

What TapMart does, derived from the codebase. This document is the
functional source of truth for the design reboot. It contains no visual
language on purpose: the current frontend has no authority over the new
design. Everything below exists and works today unless marked "later".

## What TapMart is

TapMart is one account with two modes.

- A person uses User mode to make money by doing small marketing work for
  local businesses: recreate a business's Reel, post a business's Story,
  or carry an ad on their real car.
- A business uses Business mode to find people and cars to advertise
  through, run those three campaign types, and (on a subscription) get real
  photos and videos shot for it every month, scheduled and posted.

Money is real and server side. A business funds a campaign; the platform
takes a fee percentage (an admin setting); the person earns the rest when
the business approves the work. Nothing is estimated or invented on any
screen: numbers, followers, content and connections are real or absent.

Public site: tapmart.live. App: sign in, then /home (User) or /business.

## Accounts, modes, permissions

- One profile per person: email, password, username, display name, photo,
  bio, city. Roles: user, admin.
- Onboarding after sign up: name, then "How do you want to use TapMart?"
  (earn as a person, or set up a business), then profile basics.
- A person can belong to any number of businesses (business_members). The
  session has an "active business"; switching it moves the whole app into
  Business mode for that business; choosing "Personal" returns to User mode.
  Settings shows "Use TapMart as": Personal, each business, Add business.
- Creator verification: unverified, pending, verified, rejected. Verified
  creators get a verified mark and can be assigned subscription shoots.
- Admin area (/admin): moderation, members, settings, agents, market, HQ.
  Out of scope for the reboot except as a fact.

## The three earning types (campaign kinds)

One campaign table, three kinds a person can earn from. Each campaign has
a business, a title, a brief, requirements, pay (cents), spots, a deadline,
a status (draft, open, paused, closed, completed, cancelled), and kind
specific details.

1. Recreate Reel (`recreate_reel`)
   - Details: a reference video or link (reference_media_url,
     reference_url), a duration range.
   - Flow: person sees it on Home, opens the detail, accepts (application:
     applied, accepted, declined, withdrawn), films their own version
     following numbered steps generated from the brief (the "creator
     guide": steps with timing, rules, avoid list, checklist), uploads the
     video (submission: submitted, under_review, revision_requested,
     approved, rejected, paid), the business reviews it, approval pays.
   - Businesses create one by pasting a reference Reel; TapMart drafts the
     brief (title, steps, must keep, can change, required elements, pay,
     spots, deadline) which the business edits, then publishes. Growth plan
     businesses also get trending Reels for their category with briefs
     pre generated.

2. Instagram Story ad (`instagram_story`)
   - Details: the finished creative (creative_url, a 9:16 image or video),
     a minimum follower count, how many hours it must stay live (default
     24).
   - Eligibility: the person's Instagram must be connected (see below) and
     meet the follower minimum.
   - Flow: accept, post the creative to their own Story, keep it live for
     the required hours, TapMart verifies (via the Instagram API when
     configured; otherwise a manual confirmation path), then approval pays.
   - Businesses create one by uploading the creative and setting pay,
     spots, follower minimum, live hours. (Later: TapMart generates ready
     to post Story ads for the business through the creative system.)

3. Car advertising (`car_ads`)
   - Details: placements (zones), duration in days, vehicle preferences
     (colors, body types), the artwork (artwork_url), an optional campaign
     visual (media_url). Pay is per month.
   - A person must have added a vehicle to qualify.
   - Flow: person sees the campaign, applies with a vehicle; or a business
     browses cars and sends an offer directly (car_offers: sent, countered,
     accepted, declined, cancelled, expired). An accepted offer becomes a
     booking (car_bookings: creative_pending, installation_pending,
     active, proof_required, completed, cancelled, disputed). The person
     uploads proofs (installation, periodic, odometer). Monthly pay on
     approved proofs.

Direct requests: a business can also send a Story or Recreate request to
one specific person (campaign_invites: sent, accepted, declined,
cancelled, expired). The person accepts or declines; it then follows the
normal flow. Each request opens a conversation between the two.

## User mode: what exists

Destinations today: Home, Activity, Earnings, Profile. Plus Messages,
Notifications, Search, and detail pages.

- Home (/home): a feed of open campaigns of the three kinds, ranked by
  freshness, pay, same city, and mixing all kinds; filters For you,
  Nearby, Top pay, and by kind. Each item shows the media, the pay, the
  title, the business, spots and deadline; opens the detail (/o/[id]).
  Nearby needs the person's city; without one, Home asks for it.
- Opportunity detail (/o/[id]): the media, pay, title, business, what to
  do, requirements, eligibility (Instagram connected and followers for
  Story; a vehicle for Car; nothing for Recreate), the accept action, and
  after acceptance the steps and the upload or proof flow. A direct
  request shows Accept / Decline first. Items can be saved.
- Activity (/activity): everything the person is doing: accepted and in
  progress work, submitted work awaiting review, revision requests,
  completed work, direct requests waiting for an answer, saved items.
  Statuses come from applications, submissions, invites, bookings.
- Earnings (/earnings): available balance, pending, lifetime; the
  transactions (earnings: pending, available, paid, rejected, requested);
  payout requests (requested, approved, paid, rejected) above a minimum
  payout amount (an admin setting); the platform fee is shown.
- Profile (/me): photo, name, username, city, bio, verified mark, stats
  (earned, completed, rating from business reviews), Instagram state,
  vehicles, recent campaigns, payout state; links to edit profile,
  verification, portfolio, public profile (/u/[username]), settings.
- Instagram (/me/instagram): connect via the Instagram API when configured
  (status disconnected, pending, connected, error; handle, follower count,
  recent media) or manually (handle and followers, verified_by manual).
  Disconnect. Story eligibility depends on it.
- Vehicles (/me/vehicles, /me/vehicles/new, /me/vehicles/[id]): make,
  model, year, color, body type, city, photos, which placement zones the
  person offers and asking price per zone (zones: driver door, passenger
  door, rear doors, rear window, rear panel, hood, full side, partial
  wrap, full wrap). Vehicle scan (/me/vehicles/scan): guided capture of
  eight angles plus detail photos and optional video; pipeline statuses
  queued, validating, needs_retake, recognizing, reconstructing,
  waiting_provider, complete, failed; recognition suggests make, model,
  year for the person to confirm; a 3D model appears when a
  reconstruction provider is configured, otherwise the honest state
  "waiting for provider". Later: interactive digital car on the profile,
  businesses pick zones on it, realistic ad preview.
- Shoots (/me/shoots): for verified creators assigned to business content
  shoots: the booked shoot, the plan (photos, videos), upload of
  deliverables.
- Messages (/messages, /messages/[id]): conversations between a person and
  a business (opened by a request, offer, or booking), text messages,
  system messages for state changes, presence.
- Notifications (/alerts): direct requests, car offers, bookings,
  submission decisions, payouts, shoot updates. Per kind preferences.
- Settings (/me/settings): Edit profile, Verification, Portfolio, Public
  profile and reviews, Saved, Instagram, Vehicles, Payouts, Use TapMart as
  (identity switch), Log out, Admin for admins.
- Search (/search): people, businesses, campaigns.
- Public pages: /u/[username] (a person's public profile with reviews and
  portfolio), /b/[slug] (a business's public page).

## Business mode: what exists

Destinations today: Home, Content, Create, Campaigns, Business (profile),
Settings behind it. Plus Messages, Notifications, Search.

- Home (/business): a marketplace. People: real TapMart users near the
  business (photo, name, city, verified mark, Instagram handle and
  followers only when connected, completed work count, rating), tabs For
  you, People, Nearby; open a person (/business/people/[username]) to see
  their public info, work, reviews, and send a Story request or a Reel
  request (direct request with pay and details). Cars: vehicles offering
  ad zones (photos or 3D when real, make, model, year, color, city, zones
  with asking prices); open a car (/business/cars/[id]) and send an offer
  for chosen zones, duration and monthly pay.
- Content (/business/content): only real subscription content. States:
  not subscribed; subscribed, shoot being scheduled; shoot booked (date,
  time, planned photos and videos, at the business); shoot completed;
  content processing; content delivered. Delivered files ("made for you")
  from a verified creator: approve, request an edit with a note, skip, or
  schedule (date, time, platform Instagram, format Reel, photo, Story).
  Scheduled and published posts (calendar_posts: idea, draft,
  needs_approval, approved, scheduled, published, failed); until an
  account posts for the business, "mark published" is manual. All shoots
  list and shoot detail. Brand kit entry.
- Create (/business/create): three choices, Recreate a Reel
  (/create/recreate), Instagram Story ads (/create/story), Car advertising
  (/create/car); each a short setup that ends in a published campaign
  funded from the business's wallet.
- Campaigns (/business/campaigns, /business/campaigns/[id]): every
  campaign and direct request with tabs Active, Review, Completed. Detail:
  submissions to review (approve pays, request revision, reject),
  applications to accept, invites sent, the car booking state and proofs,
  pause, close.
- Business profile (/business/profile): cover, logo, name, category, city,
  description, website, hours, services, connected accounts (only when
  really connected), plan, next shoot, active campaigns, scheduled content
  (when real), public page link. Edit at /business/edit.
- Wallet: businesses fund campaigns with credit (stripe top ups, credit
  ledger); campaign payments and refunds are ledger rows. /wallet,
  /wallet/add.
- Plan and billing (/business/plan, /business/billing): two plans,
  Essential (one shoot a month: 10 photos, 3 videos; brand kit; content
  calendar; ideas; business health; the three campaign types; campaign
  dashboard) and Growth (two shoots a month: 20 photos, 6 videos;
  trending content for the category; briefs from trends; priority
  support; later: team, multiple locations, deeper analytics). Prices are
  settings. Status trialing, active, past_due, cancelled. The subscription
  never includes campaign spend; campaign budgets are funded separately
  and go to the people who do the work.
- Brand kit (/business/brand): research from real sources (Instagram,
  Google, website, logo, uploaded imagery) with source status used, not
  connected, missing, failed; the kit: logo, palette, typography (display,
  body), tone, photo style, content style, guidelines, image examples;
  proposals with up to three improvements; draft until approved; nothing
  changes without approval.
- Connections (/business/settings/connections, /google): Instagram
  business account and Google Business Profile via OAuth when configured;
  statuses disconnected, pending, connected, error. Google health checks
  (profile completeness, hours, photos, posts, reviews) with fixes the
  business can apply; runs are stored.
- Trends (/business/trends): trending Reels for the category (Growth),
  each with a generated brief that becomes a Recreate campaign.
- Health (/business/health), Social (/business/social), Calendar
  (/business/calendar): overview surfaces built on the same data (Google
  health, connected accounts, scheduled posts).
- Team: later. Settings: account, notifications, security, business
  details, connections, brand kit, plan and billing, team (later), public
  page, identity switch, log out.
- Messages and notifications mirror User mode from the business side.

## Content shoots (the subscription service)

- A subscribed business always has its month's shoot slots planned
  (planned, then scheduled with a date and start time, then done or
  cancelled). Each has planned photo and video counts and an assigned
  verified creator.
- Delivery status: none, processing, delivered. Deliverables
  (content_deliverables): kind photo or video, url, thumbnail, caption,
  status new, approved, rejected, scheduled, published, an edit note,
  uploader (the verified creator), the shoot date.
- Calendar posts are made from deliverables (platform, format, scheduled
  time, published time).

## Money model

- Wallets and a credit ledger for businesses (stripe top ups, campaign
  payments, refunds, corrections, platform fee).
- Earnings rows for people (amount, fee, status pending, available,
  requested, paid, rejected) created when a business approves work; payout
  requests above a minimum; admin approves and pays.
- Reviews: a business rates a person after completed work; the rating
  shows on the person's profile.

## Public website (today)

Homepage with a headline, sign up and sign in, "How you earn" (the three
types), the business pitch and a business sign up, footer links (terms,
privacy, creator terms, rules). Separate /earn page. Sign in, sign up,
password reset, email confirm.

## Integrations and honest states

- Instagram (person and business) and Google Business Profile: real OAuth
  when configured; otherwise manual or "not connected". Never faked.
- Stripe for business top ups and subscriptions.
- Vehicle recognition, catalog and 3D reconstruction providers: optional;
  the pipeline stops at an honest state without them.
- AI assistance (briefs, creator guides, brand kit proposals, marketing
  recommendations): labelled by source; templates when no provider.

## Counts and scale assumptions

Local businesses in one city at a time; a person sees tens of open
opportunities, not thousands. A business sees tens of people and a
handful of cars nearby. Media per item: one hero (video or image) and a
few thumbnails. Everything must work on a phone first and on a desktop
browser second.
