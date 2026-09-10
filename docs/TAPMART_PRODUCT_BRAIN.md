# TapMart product brain

The one document a design reviewer needs before judging a TapMart screen.
It says what the product is, how it is organised, and what "looks like
TapMart" means. Keep it short and current; it is sent to the reviewer with
every screenshot.

## The visual north star

`docs/design-references/tapmart-primary-reference.png` is the official
current TapMart visual reference. It defines how good the product must look
and feel: strong clean typography, dark graphite, subtle surface
separation, restrained borders, near-white text, muted secondary text,
signal lime used selectively, premium iconography, clear primary actions,
compact clean rows, purposeful media, subtle glass, excellent spacing, a
high-end mobile-app feeling, minimal clutter. It is a quality bar, not a
template: the codebase defines what each screen does; the reference
defines how confident and polished it should be. The 3D vehicle in it
belongs mainly to the User Profile, Manage vehicle, the business's car
detail and the car-ad preview, never to every screen.

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

## Design rules (what "looks like TapMart" means)

0. **Show first, explain second.** If text is not required for the next
   decision, remove it or move it deeper. Feed cards: visual, money, short
   title, one or two metadata lines, one primary action. Media (people,
   Reels, Story creatives, cars, business photography, shoot content, brand
   imagery) provides most of the color; the interface stays restrained,
   almost monochrome until something important appears.
1. **Dark graphite, not black.** Page `#0B0D0E`, surfaces `#111416`,
   `#15191B` and `#1A1E20`, text `#F7F7F5`. Subtle glass only on chrome
   (navigation, top and bottom bars, sheets, floating controls, dialogs).
2. **Real media first.** Reel frames, Story creatives, car photos or 3D,
   deliverables, profile work. The media is the card; money and a one-line
   title sit on it over a scrim. No stock art, no placeholder illustrations,
   no icons standing in for media.
3. **Lime `#C8FF3D` only for money, the primary CTA, active navigation,
   important success and important status.** One lime button per screen
   region. Never every icon, border, badge or title.
4. **Less text.** Card: title max 2 lines, meta max 2 short rows, badges max
   3, no description. Section headings are small mono eyebrows. Explanatory
   copy is one sentence and only when the next decision needs it. No
   paragraphs on discovery screens. No "we". No em dashes or en dashes.
5. **Fewer boxes.** Never card, card, card, card. Mix full-width media, rows
   separated by thin rules, and numbers standing directly on the page. A
   card only when something must read as one object (a state, a form). No
   cards inside cards. No borders for decoration.
6. **Bigger photos and video.** 9:16 for Reels and Stories, 4:5 or 16:10 for
   people and trends, 4:3 for cars. Thumbnails are at least 48px, hero media
   fills the width.
7. **Subtle animation.** Reveal with a small stagger, a pop on confirmation,
   settle on lines that appear one by one, a live dot while something runs.
   Nothing loops forever. No bouncing, no parallax, no spinning cars.
8. **No generic AI design.** No purple gradients, glowing blobs, giant
   glass cards, identical rounded rectangles everywhere, icon-in-colored-
   square everywhere, huge unused black space, tiny typography, borders
   around every component, excessive pills, giant radius, fake analytics,
   fake content, fake users, random animation. No metric card rows, no
   charts for their own sake, no "welcome back" panels, no settings or
   alerts on discovery screens.
9. **Every tap target 44px.** Phone first (390 wide), then desktop (1360)
   with a rail.
10. **Honest states.** If a provider is not connected or a number is
    unknown, say so in one line. Never a fake score, a fake follower count,
    a fake scheduled post.

## Type and spacing

Display type is Archivo (800, tight tracking), body is Inter. Sizes: eyebrow
0.6875rem mono uppercase; body 0.9375rem; card title 1.125rem to 1.375rem;
screen title 1.75rem to 2rem; big number 1.75rem to 1.875rem. Vertical rhythm
in 4px steps: 12 inside a card, 16 between rows, 28 to 36 between sections.
Rounded 12px on controls, 16px on cards and media.

## What a reviewer should push toward

Bigger media, fewer words, fewer boxes, one lime action, money where the eye
lands first, real content instead of any placeholder, one clear next tap.
