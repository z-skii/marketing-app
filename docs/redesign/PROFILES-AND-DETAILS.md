# TapMart redesign: profiles, opportunity detail, campaign detail, review

Recorded 2026-09-21 on the redesign preview branch. The approved visual
system is unchanged. This pass rebuilds four areas only: the creator
profile, the business profile, the paid opportunity detail and the
business campaign detail with its submission review. No route, server
action, schema, permission or campaign rule changed.

## Shared pieces

`src/ds/detail.css` (loaded by the signed in layout) and
`src/components/fs/work/DetailKit.tsx`:

- **Hero**: the campaign media on a dark stage with the kind chip, the
  business logo and name, the title and the pay pill on it. A 9:16 file
  sits on a blurred copy of itself so the hero fills the width; a Story
  sits inside a phone frame; a car uses the existing premium car stage
  with the placement drawn on the car and the artwork on it when the
  business supplied one.
- **Facts**: four icon tiles (pay, deadline or term, spots, location or
  placement). No sentences.
- **Action card**: pay first, what the person keeps after the fee, one
  primary control decided by the real state, three mini facts. It is the
  sticky rail on desktop and follows the facts on the phone.
- **Sticky bar** (phone only): pay plus one button that jumps to the
  action card, shown while the card is off screen, above the tab bar.
- **Steps** (four short rows with icons), **Checks** (checklist rows),
  **Timeline** (six stages with the current one highlighted),
  **Accordion** (secondary information), **Business card**.
- **Profile parts** (`src/components/fs/profile/Parts.tsx`,
  `BusinessParts.tsx`): head, stats row, chips, work grid, recent work
  rows, reputation, reviews, business hero, gallery, about rows.

## Creator profile (`/me`, `/u/[username]`, `/business/people/[username]`)

Identity first: a large round avatar, name, handle, city, verified,
Instagram handle and count when connected, a short bio, then subtle
owner actions (Edit, Share, gear) or the viewer's actions (Follow,
Request Story, Request Reel). A compact stats row: Jobs, Rating (only
when reviews exist), Earned (own profile only) or Followers. Skill chips
derived from the record: Reels, Stories, Cars, Portfolio, Instagram. The
work grid (approved work and portfolio, first tile large, play mark on
video, tap opens the file) is the biggest module. Recent work as rows:
logo, business, kind, status chip, amount. Reputation and reviews only
when reviews exist. The car as one row, then the account rows. Desktop:
identity column plus content column.

## Business profile (`/business/profile`, `/b/[slug]`)

Cover with the logo over its edge, name, @slug, type, city, verified, a
short description (two lines then More), the brand's first palette colour
as a subtle accent when a kit is approved. Quick info: Campaigns,
Creators, Rating (only with reviews) or Delivered. Open campaigns as the
same cards Home uses. A content gallery from the business's real media
(approved shoot files on the own page, campaign creatives, brand kit
examples). About rows lower down: location, website, Instagram, joined,
type. The own page adds the management rows (plan, next shoot,
campaigns, scheduled, connections, brand kit, public page).

## Opportunity detail (`/o/[id]`)

The first viewport answers what, who pays, how much and what next: the
hero with the pay, the four facts, the action card with the state
(Open, Your car fits, Request for you, Revision, In review, Approved,
Paid, Closed, Full). Then What to do (four steps), Requirements (checks
plus a Full requirements accordion), Reference or Creative or Artwork,
Business card, Timeline, and Payment details and Terms as accordions.

- Recreate: reference dominates. Watch, recreate, post, upload.
- Story: the creative in a phone dominates. Post, keep live, send proof,
  get paid. Instagram eligibility is a check row and the action card
  offers Connect Instagram when needed.
- Car: the car stage with the placement dominates. Apply, install,
  drive, send a photo. Facts: pay a month, term, area, placement.

## Business campaign detail (`/business/campaigns/[id]`)

Visual, name, kind chip, status, then Spent, Submissions, Approved of
slots, Remaining, a progress bar (paid, approved, submitted) with the
creators count, and Needs you rows. Submissions are media cards with the
creator, the date and the decision on each: Approve (pays through the
existing action), Revise and More (open review, view profile, open
original, download, reject). Requirements, Creative, Targeting, Schedule,
Budget and Controls sit in accordions below.

## Submission review (`/business/campaigns/[id]/submissions/[sid]`)

Desktop: the file large on a stage on the left, the creator, campaign,
status, money and actions in a sticky rail on the right. Phone: media
first, then the rail. Approve is primary, Revise secondary, Reject lives
in More. Revise and Reject open a sheet for the note after the choice.
`?panel=changes` and `?panel=reject` open that sheet directly.
