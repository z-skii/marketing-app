# TapMart product brain

The one document a design reviewer needs before judging a TapMart screen.
It says what the product is, how it is organised, and what "looks like
TapMart" means. Keep it short and current; it is sent to the reviewer with
every screenshot.

## The visual north star

TapMart looks like an Apple product presentation crossed with a premium
creator economy platform: large confident typography, strong hierarchy,
controlled whitespace, immersive photography, soft coloured environments
that change by section (white, warm grey, ice blue, blush, cream,
charcoal), glass for navigation and floating information, subtle
gradients, soft neutral shadows, depth, floating interface objects,
realistic devices, an isolated realistic car, and a single motion system
that tells the story. TapMart red is the only accent and is used
selectively: the primary action, the active tab, the one thing that
needs a decision. It is never the whole page. The system is coded in
`src/app/globals.css` (tokens `--tm-*`, environments `--env-*`, the
primitives), `src/ds` (icons, motion, photo, UI, the car stage, the
shell) and `src/ds/app.css` (the signed in screens); the public site is
`src/site`. The isolated car belongs to the landing page, My cars, the
car campaign screens and the business car pages, never to every screen.

## What TapMart is

One account, two modes.

- A **person** opens TapMart to make money: recreate a business's Reel, post
  a Story for a business, or carry an ad on their car.
- A **business** opens TapMart to find people and cars to advertise through,
  run those three campaign types, and get real content made for it on a
  subscription.

Money is real and server-side. The business approves work; approval pays.
Nothing on a screen is estimated or invented: numbers, followers, reviews,
content and connections are either real or absent.

## User mode

Bottom bar: Home, Activity, Earnings, Profile.

| Screen | What it is for | What must be obvious |
| --- | --- | --- |
| Home | All ways to make money. Only three opportunity types, no separate tabs for them: Recreate Reel, Instagram Story, Car Ad. Three visually distinct compositions, not one card template: Recreate = large reference video, money, "Recreate this Reel", business, spots and deadline, one CTA. Story = the actual Story creative, money, "Post for 24 hours", business, follower requirement, one CTA. Car = large car or campaign visual, money per month, "Drive with this campaign", city and duration, one CTA. | The media, the money, one verb. |
| Activity | Accepted, active, submitted, completed work, and direct requests from businesses (Accept / Decline). Compact rows with the campaign thumbnail: thumbnail, "Recreate · Business", status, money, chevron. No text-heavy cards. | What is waiting on me, what is waiting on the business. |
| Earnings | Money, visually dominant: Available, Pending, Lifetime as numbers on the page, then clean transaction rows. Not a wall of statistic cards. | The number. |
| Profile | TapMart identity. The person is primary: photo, name, city, reputation; small stats (Earned, Completed, Rating). Then a smaller premium vehicle card ("2025 BMW M4 · Vehicle ready for ads", a small interactive 3D car when a real model exists, "Drag to rotate"; a subtle first movement, then still). Then rows: Instagram connected, Vehicle ready for ads, Recent campaigns, Payout ready. Settings gear at the top. | Who I am here, is Instagram connected, is my car listed. |

Opportunity detail (`/o/<id>`): the reference media large, money and one-line
title on the media, numbered visual steps, rule chips, then the upload flow
with progress and a requirement check. A direct request shows an Accept /
Decline banner at the top.

## Business mode

Bottom bar: Home, Content, Create (lime plus in the middle), Campaigns,
Business. Desktop: compact left sidebar with one lime "Create campaign".

| Screen | What it is for | What must be obvious |
| --- | --- | --- |
| Home | A marketplace, not a dashboard: browse real people (media-first portraits, Instagram only when connected, little metadata) and cars available for ads (large media or real 3D, money visible). Tabs For you, People, Cars, Nearby. A business can request a Story or a Reel from a person, view a car, send a car advertising offer. | Faces, work, cars. One filled action and one quiet action per person, one action per car. |
| Content | Only real subscription content: next shoot, what the verified creator delivered ("Made for you"), what is scheduled and published. Honest empty states by subscription state. | What is scheduled, what is new to approve. |
| Create | Exactly three choices: Recreate a Reel, Instagram Story ads, Car advertising, as three premium visual entry points (video, Story creative, vehicle or ad imagery) with very little text. Not three SaaS cards. | Three big media tiles. |
| Campaigns | Public campaigns and direct requests. Tabs Active, Review, Completed. Type-specific media: Recreate = video thumbnail, Story = the creative, Car = vehicle or campaign visual. Status readable at a glance. | What needs review (lime), submissions x / y, "Sent to @person". |
| Business | The business's own profile in the same profile language as the reference: cover, logo, name, category, city, connected icons only when really connected, a small overview (current plan, next shoot, active campaigns, scheduled content when real), gear in the corner. | Looks like a brand profile, not a dashboard. |
| Settings (behind the gear) | Simple clean rows: Account, Business details, Connections, Brand kit, Plan and billing, Team, Notifications, Security, Log out. Connections show Connected, Not connected, Needs reconnect, Error, never faked. Google shows only a setup state until a real OAuth connection exists, then real attention items. Brand kit researches real sources first (Instagram, Google, website, logo, imagery), shows a visual kit (logo, colors, typography, photo style, voice, content style) and suggested refinements separately; nothing changes without approval. | Grouped rows, still premium. Complexity lives here and nowhere else. |

Direct requests: a business opens a person and sends a Story or Reel request,
or opens a car and sends an ad offer. The person accepts or declines. It then
follows the normal Story, Recreate or Car booking flow.

## Public website (recorded 2026-09-16 at Stage 6)

The front door at / is the product told in the order a person meets it:
Recreate, Post, Drive, Get paid, then how businesses use TapMart
(campaigns, then monthly content), then the two plans. Rules:

- Every screen shown is a real production capture taken with the demo
  accounts, in a device frame, with a native caption that names the demo
  account and the literal state, and an Inspect action that opens the same
  file at readable size. Never a Design Lab capture, never an image-model
  dashboard. Captures live in public/marketing/frames and are retaken when
  the screen they show changes.
- A commitment plane beside a source (amount, basis, conditions) describes
  the demo record in the capture next to it, so the numbers in the plane
  and in the frame always agree.
- Supporting imagery is captioned for what it is: a generated illustration
  says so; a supplied Story creative is shown intact at 9:16 with no
  radius; no ad is ever composited onto a photographed car.
- Prices, shoot allocations, the payout minimum and the fee are read from
  the same configuration the app uses (src/config/plans.ts, planPrices(),
  app settings). Three kinds of money stay apart on the page: subscription,
  campaign credit, creator earnings. No instant-payout promise; payouts are
  described as TapMart sends them.
- No video and no 3D are shown while none exist in production media.
- Motion: one sticky product stage per chapter on desktop whose active
  frame is a pure function of scroll position; one-time 320ms reveals;
  phone chapters are horizontal strips with Previous and Next; nothing
  hijacks or snaps the page scroll; reduced motion removes every
  transition.
- A signed-in visitor can read the page and gets one Open TapMart action;
  sign-in itself still lands in the app.
- Navigation stays minimal: wordmark, Earn, For businesses, How it works,
  Pricing, Sign in, Get started; a bottom sheet under 1024px.

## Design rules (what "looks like TapMart" means)

0. **Show first, explain second.** If text is not required for the next
   decision, remove it or move it deeper. Media (people, Reels, Story
   creatives, cars, business photography, shoot content) provides most
   of the colour; the interface stays restrained.
1. **One system.** Tokens in globals.css: canvas `#F5F4F1`, surface
   white, ink `#121417`, muted `#6B7079`, TapMart red `#E0212B`,
   environments white, warm, ice, blush, cream, charcoal. Shape: pill
   actions, 12px controls and rows, 20px cards and objects, 28px sheets
   and the floating navigation. Shadows are soft and neutral; borders are
   never decoration. Anything else is drift.
2. **Real media first.** Reel frames, Story creatives, car photographs,
   deliverables, portraits, licensed photography chosen for the feature
   it explains. No stock filler, no placeholder illustrations, no icons
   standing in for media. Every image has a loading surface and an honest
   fallback.
3. **Red only for the primary action, the active navigation item, the
   one decision waiting and the brand mark.** Status uses the word with
   its own colour (success, warning, info, alert) beside it. Never every
   icon, border, badge or title.
4. **Less text.** A card is image, kind or status chip, title (max 2
   lines), one metadata row, pay and one action; the detail screen
   answers what, how much, what do I do and when in its first viewport.
   No paragraphs on discovery screens, no page subtitles that explain
   the page, no description under every settings row. Labels are the
   shortest clear word ("View", "Revise", "Near you", "Needs review",
   "New campaign"). No "we". No em dashes or en dashes.
5. **Fewer boxes.** Objects (cards) only where something must read as one
   thing; otherwise rows, rules and numbers standing on the page. No
   cards inside cards.
6. **Bigger photos and video.** 9:16 for Reels and Stories, 4:5 for
   people, 16:10 or 4:3 for cars and scenes; hero media fills the width.
7. **One motion system** (`src/ds/motion.tsx`): reveals fade and rise
   once, groups stagger, parallax moves imagery and floating objects,
   sticky storytelling holds a visual while the explanation changes,
   numbers count up once, pages fade in, buttons press. Transform and
   opacity only, 60fps, and reduced motion renders everything still.
8. **Glass with intent.** Navigation, floating information cards, filters,
   tags on media, sheets and overlays: translucent surface, background
   blur, a white hairline, a soft shadow, a highlight. Not every element.
9. **Real icons.** Phosphor, one weight, one size scale (`src/ds/icons.ts`).
   Never a Unicode glyph or an emoji as an interface icon.
10. **Every tap target 44px.** Phone first (390 wide), then 430, 768, 1024
    and 1440 and up. No horizontal overflow at any of them.
11. **Honest states.** If a provider is not connected, a feature is not
    built (Loyalty, Share and earn) or a number is unknown, say so in one
    line and label previews as previews. Never a fake score, a fake count
    or a fake scheduled post.
12. **One action hierarchy.** One primary action, at most one secondary,
    everything else inside a "More" menu (`src/ds/Menu.tsx`). Universally
    understood actions carry their icon (approve check, reject x, edit
    pencil, delete trash, share, download, filter, search, more, back).
    Icon-only buttons always have an accessible name and, on desktop, a
    tooltip (`data-tip`). Status is a chip with one word and one colour,
    the same in both apps: Open, Live, Full, Submitted, In review,
    Revision, Approved, Paid, Scheduled, Posted, Needs review
    (`STATUS_LABEL` in `src/ds/ui.tsx`).
13. **One scale for both apps.** Buttons and icon buttons 32, 40 or 48px;
    icons 16, 20 or 24px; radii 12 (controls, rows), 20 (cards), 28
    (sheets); spacing on 4, 8, 12, 16, 24, 32, 48, 64. Settings in both
    apps are grouped icon rows (`SettingsGroup`, `SettingsRow`): Account,
    Business or Creator, Notifications, Payments, Privacy and security,
    Support; binary settings are switches.

## Type and spacing

Everything is DM Sans. Editorial display sizes (`.t-hero` up to 96px,
`.t-h1` up to 56px) belong to the marketing site only. In the apps:
page title 28 to 32px on the phone and 34 to 38px on the desktop,
section 20 to 24px, card title 16 to 18px, body 14 to 16px, meta 12 to
14px; money is tabular and bold. Sections start 24 to 32px below the
previous block; cards sit 16px apart; rows 8px apart.

## What a reviewer should push toward

Bigger media, fewer words, fewer boxes, one red action, money where the
eye lands first, real content instead of any placeholder, motion that
tells the story, one clear next tap.

## Backlog (non-blocking, recorded 2026-09-12 at Stage 1 approval)

1. Desktop User Home: when the number of open opportunities is uneven for
   the 358px column grid, a single trailing object leaves a visual gap.
   Handle that gracefully later (for example a different last-row
   treatment); not a Stage 1 blocker.
2. Video submissions without a poster: investigate generating a truthful
   thumbnail from the actual uploaded video when the platform can decode
   it. Until then the honest "View video · No preview available" state
   stays. Never fabricate media.
3. Desktop rail unread badges (Messages, Notifications) are cobalt. The
   design QA director suggested graphite (#1D2833) so cobalt stays reserved
   for decisions. The rail is part of approved Stage 1; revisit with the
   shell, not per screen.

## Backlog (non-blocking, recorded 2026-09-12 at Stage 2 approval)

4. Activity on desktop may later use the empty right side for real
   contextual detail when useful. Never filler or invented summaries.
5. Recreate accepted and revision detail may later consider progressive
   disclosure for secondary instructions, only after the next required
   action and the critical shot requirements stay immediately visible.
6. Payout timing, payout minimum and fee language must keep coming from
   real current configuration and settings wherever technically possible.
   No operational promise is hardcoded.

## Backlog (non-blocking, recorded 2026-09-12 at Stage 3 approval)

7. Business Home on phones: if real creator metadata ever becomes too
   tall, consider progressive disclosure for lower-priority stats while
   the decision information (work, name, provenance, request) stays
   visible.
8. Desktop People and Cars shelves should ultimately support natural
   mouse and touchpad dragging, or an equally polished interaction, in
   addition to Next and Previous, when the architecture supports it
   cleanly.
9. Repeated seed vehicle and media images are acceptable for demo data.
   Never invent visual diversity in production; real records determine
   variety.

## Backlog (non-blocking, recorded 2026-09-16 at Stage 5)

10. Team: the product has no invitation record, so Team lists only the
    members and roles that exist and says invitations are not available
    yet. When invitations are built, they need their own stored state
    (invited, accepted, expired) before any invited row is drawn.
11. A Contact support link appears on the unconfigured Google and
    Instagram states only once a real support mailbox is configured in
    src/config/site.ts. Until then the sentence stands without a link.
12. The shared Home opportunity objects keep their cobalt View work link
    on the public business page; the design QA director suggested ink for
    inspection links there. Revisit with the Stage 1 objects, not per
    screen.
13. Portfolio samples are shown as ordinary media at 4px corners. A
    supplied Story sheet is only drawn square when the record says the
    file is a Story creative; a portrait photo is never assumed to be one.
14. Business Search reuses the Stage 3 person and car compositions from
    Business Home unchanged. The design QA director asked for the full
    work title on its own line and for the reputation counts to move off
    the discovery caption; both belong to the approved Home objects and
    are revisited there, not on Search.

