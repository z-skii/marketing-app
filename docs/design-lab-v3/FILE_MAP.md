# TapMart V3 routes and files

Every route below is gated: the Lab renders in development, or in
production only when `DESIGN_LAB=1`; otherwise `src/app/design-lab-v3/
layout.tsx` calls `notFound()`. Nothing under `/design-lab-v3`
authenticates, reads or writes the database, calls a Wallet service or
delivers a notification. All state is the in memory fixture store in
`src/app/design-lab-v3/store.tsx`, which a reload resets.

## Routes

| Route | Page file | Body |
| --- | --- | --- |
| `/design-lab-v3` | `page.tsx` | `x/site/Hero.tsx`, `x/site/Earn.tsx`, `x/site/Business.tsx`, `x/site/Loop.tsx`, `x/site/Shell.tsx` |
| `/design-lab-v3?audience=business` | same | the hero lens; both stories stay in the document |
| `/design-lab-v3/home` | `home/page.tsx` | `x/home/Feed.tsx` |
| `/design-lab-v3/home?open=<opportunity id>` | same | opens that opportunity through `x/Open.tsx` |
| `/design-lab-v3/profile` | `profile/page.tsx` | `x/profile/Profile.tsx` |
| `/design-lab-v3/profile?view=public` | same | the guest share view, owner controls removed |
| `/design-lab-v3/profile?work=<work id>` | same | inline work inspection |
| `/design-lab-v3/business` | `business/page.tsx` | `x/business/Discovery.tsx` |
| `/design-lab-v3/business?person=<id>&work=<n>` | same | person inspection |
| `/design-lab-v3/business?person=<id>&request=1` | same | request composer, local review only |
| `/design-lab-v3/business?vehicle=car-eli-rear-doors&zone=rear-doors` | same | vehicle inspection |
| `/design-lab-v3/business?vehicle=...&offer=1` | same | offer composer, local review only |
| `/design-lab-v3/business/profile` | `business/profile/page.tsx` | `business/profile/BusinessProfile.tsx` |
| `/design-lab-v3/business/loyalty` | `business/loyalty/page.tsx` | `business/loyalty/LoyaltyHome.tsx` |
| `/design-lab-v3/business/loyalty/record` | `.../record/page.tsx` | `record/Record.tsx`, `record/CounterActions.tsx` |
| `/design-lab-v3/business/loyalty/members` | `.../members/page.tsx` | `members/Members.tsx` |
| `/design-lab-v3/business/loyalty/members/[id]` | `.../members/[id]/page.tsx` | `members/[id]/MemberDetail.tsx` |
| `/design-lab-v3/business/loyalty/program` | `.../program/page.tsx` | `program/ProgramView.tsx` |
| `/design-lab-v3/business/loyalty/create` | `.../create/page.tsx` | `create/Create.tsx`, `create/CardControls.tsx` |
| `/design-lab-v3/business/loyalty/qr` | `.../qr/page.tsx` | `qr/QRView.tsx` |
| `/design-lab-v3/business/loyalty/attribution` | `.../attribution/page.tsx` | `attribution/Attribution.tsx` |
| `/design-lab-v3/business/loyalty/updates` | `.../updates/page.tsx` | `updates/Updates.tsx` |
| `/design-lab-v3/business/loyalty/updates/new` | `.../updates/new/page.tsx` | `updates/new/Composer.tsx` |
| `/design-lab-v3/join/[code]` | `join/[code]/page.tsx` | `join/Join.tsx` |
| `/design-lab-v3/c/[code]` | `c/[code]/page.tsx` | `c/[code]/Handoff.tsx` |
| `/design-lab-v3/card/[code]` | `card/[code]/page.tsx` | `card/[code]/CardView.tsx` |

`?lab=<scenario>` on any route selects a fixture scenario once on arrival
(`LabControl.tsx`): `live`, `none`, `draft`, `live-empty`, `points-82`,
`points-99`.

## V3 experience files, new in this stage

| File | Lines | What it is |
| --- | --- | --- |
| `x/x.css` | 169 | The material system: tokens, the two lens recipes, working paper, grip, typography, the floating app bar, pause behaviour |
| `x/site.css` | 377 | Public homepage layout: navigation, hero, the four earning chapters, the business run, the Loyalty loop, footer |
| `x/app.css` | 269 | App surfaces: the working task, User Home, User Profile, Business Home, and the Loyalty restyle |
| `x/motion.tsx` | 85 | Motion provider, Pause motion control, lab strip, pause aware presentation timer |
| `x/Stage.tsx` | 123 | The sequence engine: frames, playback, direct access, Steps, ordered reduced motion output |
| `x/Open.tsx` | 123 | Object continuity: the selected media becomes the working task, with history and focus restoration |
| `x/Nav.tsx` | 108 | The two app shells and the V3 identity switchers |
| `business/loyalty/TaskHead.tsx` | 23 | The one head for the focused Loyalty tasks: Back, title and step fact, Close, lab and motion strip |
| `x/Plan.tsx` | 16 | The flat rear door placement plan |
| `x/media.ts` | 29 | Responsive derivative paths |
| `x/site/Shell.tsx` | 126 | Public navigation, lab strip, media sources, footer, chapter frame |
| `x/site/Hero.tsx` | 86 | One brief, two viewpoints |
| `x/site/Earn.tsx` | 294 | Recreate, Post, Drive, Get paid |
| `x/site/Business.tsx` | 209 | Find people, Find cars, Create, Review, Monthly content |
| `x/site/Loop.tsx` | 144 | The source preserving Loyalty loop |
| `x/home/Feed.tsx` | 179 | User Home |
| `x/profile/Profile.tsx` | 160 | User Profile, share sheet, settings sheet |
| `x/business/Discovery.tsx` | 313 | Business Home, person and vehicle tasks, request and offer composers |

## Loyalty foundation, kept and restyled

`store.tsx` (233 lines), `fixtures.ts` (159), `Progress.tsx`, `qr.tsx`,
`LabControl.tsx`, `parts.tsx`, `settings.ts`, `useOrigin.ts` and the
whole `business/loyalty` tree are unchanged in behaviour. After the
director's pass 1 the Loyalty surfaces were restyled further without
touching the model: `business/loyalty/TaskHead.tsx` is the one head for
the focused tasks (the counter, creation, the counter QR); `record/page.tsx`
and `qr/page.tsx` render those tasks as a 560px pane beside inert Loyalty
Home on desktop; `attribution/Attribution.tsx` places identities in the
left field and descents on one scale at the right; `wallet/Cards.tsx`
draws the Apple concept to the store card anatomy (header field, full
width strip, secondary and auxiliary fields, barcode). `v3.css` (500 lines) still carries the Loyalty
component styles; `x/app.css` re-points its surface styling into the V3
material language. The event model, first touch attribution, reward
instances, same day rule, QR distinctions and Wallet concepts are exactly
as verified in the seven READY reviews under `docs/design-lab-v3/reviews`.

## Shared with the V2 Lab, read only

`src/app/design-lab-v2/`: `Sheet.tsx`, `Preview.tsx`, `Viewer.tsx`,
`Img.tsx`, `Outside.tsx`, `parts.tsx` (Rail, TabBar, Utilities, Money,
Avatar, Wordmark), `Switcher.tsx` and `fixtures.ts`. V3 imports these;
none of them were modified, and `/design-lab-v2` renders exactly as it
did before this stage.

## Director tooling

`src/lib/openai/v3x.ts` holds the V3 experience direction, screen design
and review jobs; `src/lib/openai/v3.ts` the Loyalty jobs;
`scripts/creative.ts` exposes them as `npm run creative -- v3x-direction`,
`v3x-screen <key>` and `v3x-review <key>`. Models and efforts live only in
`src/lib/openai/models.ts`.

## Media

Originals under `public/design-lab/` and `public/design-lab-v2/assets/`.
Responsive derivatives under `public/design-lab-v3/m/`, generated from
those originals; `docs/design-lab-v3/MEDIA_MANIFEST.json` records every
source, owner, record binding and crop.

## Evidence

`docs/design-lab-v3/captures/` (primary surfaces, `viewports/`,
`states/`, `INDEX.json`), `docs/design-lab-v3/recordings/` (webm plus a
frame strip per take). Every path in the report is repository relative;
no scratchpad or temporary path is referenced.
