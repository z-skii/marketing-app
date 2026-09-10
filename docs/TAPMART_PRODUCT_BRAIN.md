# TapMart product brain

The one document a design reviewer needs before judging a TapMart screen.
It says what the product is, how it is organised, and what "looks like
TapMart" means. Keep it short and current; it is sent to the reviewer with
every screenshot.

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
| Home | Opportunities: Recreate a Reel, Instagram Story, Car Ad. One media-first card each. | The media, the money, one verb ("Recreate", "Post", "Drive"). |
| Activity | Work in progress, submitted, completed, saved. Includes direct requests from businesses (Accept / Decline). | What is waiting on me, what is waiting on the business. |
| Earnings | Money: available, pending, paid, payouts. | The number. |
| Profile | TapMart identity: photo, name, username, city, verification, rating, Instagram connection, the car (3D, turntable or still), settings, log out. | Who I am here, is Instagram connected, is my car listed. |

Opportunity detail (`/o/<id>`): the reference media large, money and one-line
title on the media, numbered visual steps, rule chips, then the upload flow
with progress and a requirement check. A direct request shows an Accept /
Decline banner at the top.

## Business mode

Bottom bar: Home, Content, Create (lime plus in the middle), Campaigns,
Business. Desktop: compact left sidebar with one lime "Create campaign".

| Screen | What it is for | What must be obvious |
| --- | --- | --- |
| Home | A marketplace: browse people (with real work media, Instagram only when connected) and cars available for ads. Tabs For you, People, Cars, Nearby. | Faces, work, cars. Two actions per person (Request Story, Request Reel), one per car (View car). |
| Content | Only real subscription content: next shoot, what the verified creator delivered ("Made for you"), what is scheduled and published. Honest empty states by subscription state. | What is scheduled, what is new to approve. |
| Create | Exactly three choices: Recreate a Reel, Instagram Story ads, Car advertising. Then trends to start from. | Three big media tiles. |
| Campaigns | Public campaigns and direct requests. Tabs Active, Review, Completed. Type-specific media cards. | What needs review (lime), submissions x / y, "Sent to @person". |
| Business | The business's own profile: cover, logo, name, category, city, connection marks, three numbers (Views, Active campaigns, Scheduled posts), what is next, gear. | Looks like a brand profile, not a dashboard. |
| Settings (behind the gear) | Account and security (log out), notifications, business details, connections (Instagram, Google), brand kit, plan and billing, identity switch. | Grouped rows. Complexity lives here and nowhere else. |

Direct requests: a business opens a person and sends a Story or Reel request,
or opens a car and sends an ad offer. The person accepts or declines. It then
follows the normal Story, Recreate or Car booking flow.

## Design rules (what "looks like TapMart" means)

1. **Dark graphite, not black.** Page `#0B0D0E`, surfaces `#111416` and
   `#15191B`, text `#F7F7F5`. Subtle glass only on chrome (top strip, bottom
   bar, sheets).
2. **Real media first.** Reel frames, Story creatives, car photos or 3D,
   deliverables, profile work. The media is the card; money and a one-line
   title sit on it over a scrim. No stock art, no placeholder illustrations,
   no icons standing in for media.
3. **Lime `#C8FF3D` only for the important action and for money.** One lime
   button per screen region. Money is lime. Everything else is ink, soft ink,
   faint ink.
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
8. **No generic AI dashboard look.** No metric card rows with icons, no
   charts for the sake of charts, no "welcome back" panels, no gradient
   blobs, no purple, no three equal feature cards with icons, no settings or
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
