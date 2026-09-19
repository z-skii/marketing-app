# TapMart redesign report

Branch `claude/install-design-dev-skills-u6bo6j`, built on the released
V3 production commit. The redesign is in place: every existing route
keeps its URL, its Supabase queries, its server actions, its auth and
its permissions. Only presentation changed: tokens, shells,
compositions, media and motion. Nothing is a separate demo.

## 1. Pages redesigned

Public

- `/` The landing page rebuilt as a launch story: nav pill, hero
  (DRIVE. RECREATE. SHARE. GET PAID.) with the isolated car and a
  composition of real product objects, then Drive, Recreate, Share,
  Loyalty (coming soon), Business, Plans and footer as sticky
  scroll chapters. Reads the same plans, prices and settings as before.
- Sign in, sign up, reset, onboarding: the auth shell carries the
  wordmark, the warm environment and the new fields and buttons.
- Legal pages, public creator and business profiles: new tokens and
  primitives through the shared stylesheets.

Creator

- `/home` Opportunities marketplace: editorial cards with media, kind
  tag, money badge, business row, what you do, how long, requirements,
  spots and deadline; filters All, Recreate, Story, Car and Loyalty
  (coming soon); ordering For you, Nearby, Top pay; paging unchanged.
- `/activity` Work timeline with the stage rail (Accepted, Creating,
  Submitted, In review, Approved, Paid; bookings run Accepted,
  Installation, Proof, Running, Paid), status badges and a "Your move"
  marker.
- `/earnings` Balance object, metrics, transactions with gross, fee
  and what you keep.
- `/me` Profile, `/me/vehicles` and `/me/vehicles/[id]` My cars on a
  dark stage with facts (verification, active placement, monthly pay,
  days remaining, proof requirements) and placement zones.
- `/share` Share and earn: coming soon page with the example pass, no
  Wallet issuance claims.
- Settings, edit, creator, Instagram, portfolio, shoots, search,
  messages, alerts, opportunity details and work flows: shell, tokens,
  pills, badges and icons.

Business

- `/business` Business Home answering "what needs attention", "what is
  working" and "what to do next": attention band with animated counts
  (needs approval, content ready, active campaigns, next shoot), the
  recommended next action, and the people and cars marketplace.
- `/business/campaigns` Campaign cards with kind, status, audience,
  progress, spots, pay, paid out and next action.
- `/business/create` and the three flows: visible step progress rail.
- `/business/content` Monthly content studio with the week strip
  (posts, platforms, status) above the existing workspace, library,
  calendar and shoots.
- `/business/loyalty` Loyalty mini OS as a coming soon preview: the
  pass on the brand kit palette and logo, a real QR to the business
  page, counters that read "Not running", and the planned features.
- Profile, settings, brand kit, Google, plan, billing, team, social,
  trends, people, cars, messages, alerts and search: shell, tokens,
  pills, badges and icons.

Untouched by design

- `/design-lab`, `/design-lab-v2`, `/design-lab-v3` (gated internal
  tooling) and `src/legacy`.
- Admin and the original link board (`/board`, `/dashboard`, `/earn`,
  `/l/[slug]`) receive the tokens only.

## 2. Components created

Design system (`src/ds`)

- `icons.ts` Phosphor icon set with semantic names and one size scale.
  Every Unicode glyph and emoji used as an interface icon was replaced.
- `photos.ts` and `Photo.tsx` the photo library (25 photographs at
  three widths in AVIF with JPEG fallback) with skeleton loading and an
  icon fallback on failure.
- `motion.tsx` the one motion system: Reveal, Stagger and Item,
  Parallax, Float, CountUp, Pressable, PageTransition,
  useSectionProgress and a hydration safe useReducedMotion.
- `ui.tsx` Button (primary, secondary, ghost, dark, glass), Eyebrow,
  SectionHead, Badge and StatusBadge, Chip, Metric, Empty, Glass,
  LinkRow.
- `Brand.tsx` Mark and Wordmark.
- `shell/AppShell.tsx` and `shell/nav.ts` the unified shell: sidebar on
  desktop, top bar and floating glass tab bar on phones, red Create in
  the middle for businesses, unread badges, one nav model for both
  route groups.
- `car/CarStage.tsx` the signature car presentation.
- `app.css` application compositions (marketplace grid, timeline,
  balance, car stage, campaigns, week strip, loyalty preview).

Application (`src/components/app`)

- `OpportunityCard.tsx`, `BusinessCards.tsx` (PersonCard, CarCard),
  `WeekStrip.tsx`, `Count.tsx`.

Landing (`src/site`)

- `Nav`, `Hero`, `Drive`, `Recreate`, `Share`, `Loyalty`, `Business`,
  `Plans`, `Footer`, `Story` (sticky scroll chapters), `Devices`
  (phone and laptop frames) and `site.css`.

Pages

- `share/SharePass.tsx`, `business/loyalty/LoyaltyPreview.tsx`,
  `template.tsx` in both route groups for page transitions.

Tokens

- `globals.css` root tokens (`--tm-*`, `--env-*`), Tailwind theme
  aliases, glass, radii, shadows, motion durations, primitives and the
  application shell; `frame-shift.css` and `v3/prod.css` re-pointed to
  the same tokens so the older screens follow automatically.

## 3. Animations added

- Page transitions between routes (a rise on every navigation, both route groups).
- Scroll reveals and staggered lists on every redesigned screen.
- Parallax on hero imagery and the car; floating product objects.
- Sticky storytelling chapters on the landing (Drive, Recreate, Share,
  Loyalty) with step highlighting and animated annotations.
- Card hover and press feedback, button press feedback.
- Count-up numbers on Business Home and the landing dashboard.
- Car: pointer parallax, scroll linked rotation, drift, highlight
  sweep, floor shadow and reflection.
- Week strip, timeline rail and progress rails.
- Every animation is skipped under prefers-reduced-motion, detected
  without a hydration mismatch. The landing hero enters from CSS so
  nothing waits for JavaScript, and page transitions are a CSS rise so
  no screen starts hidden behind hydration.

## 4. 3D and media implementation

- No legally usable 3D car model exists in the repository or its
  assets, so the isolated render approach was used: three car
  photographs were background removed into transparent WebP and PNG
  renders (`public/photos/cars`) and presented on `CarStage` with CSS
  3D perspective, pointer parallax, scroll linked rotation, floor
  shadow, reflection and placement overlays (rear door, front door,
  rear window, full side) that can carry a campaign artwork. Phones get
  the still version with scroll rotation only.
- Vehicle pages keep the existing 3D viewer when a vehicle has a
  scanned model and show the photograph on the dark stage otherwise.
- Photography: 25 Unsplash photographs converted by
  `scripts/photos-build.mjs` to AVIF at 640, 1200 and 1800 with a JPEG
  fallback; credits in `public/photos/CREDITS.md`. Existing seed and
  campaign media is reused where the product already had it.
- Media loads lazily below the fold with skeletons; the hero car,
  story and reel images load eagerly.

## 5. Existing functionality preserved

- All 64 application routes and 18 API handlers keep their paths.
- Queries, server actions, uploads, submissions, approvals, direct
  requests, bookings, payouts, messaging, notifications, search,
  onboarding, plans and billing are unchanged. Diff review: no file
  under `src/lib`, `src/app/api` or `actions.ts` changed.
- Roles and redirects: the business and personal modes keep their
  layouts, guards and redirects; the shell reads the same context.
- Forms keep their validation and error states; the fields only took
  the new tokens.
- Tests: `vitest` 140 passed; `tsc` clean; ESLint 0 errors (79
  pre-existing `<img>` style warnings); `next build` succeeds.

## 6. Verification

- Route sweep on the production build, three states (signed out,
  creator, business) at 390 and 1440: 128 captures across 64
  routes, every response 200, 0 page errors, 0 console errors, 0
  horizontal overflow, 0 internal labels leaking.
- Responsive pass at 320, 390, 430, 768, 1024 and 1440: no horizontal
  overflow, no console errors.
- Reduced motion pass: identical content, no animation.
- Lighthouse (performance, medians of three runs, production build).
  The simulated mobile LCP is Lighthouse's slow 4G model with a four
  times slower CPU, which charges the script bundle against the first
  image; the observed paint on the same runs is under half a second.

| Route | Mobile | Desktop | Mobile LCP | CLS |
| --- | --- | --- | --- | --- |
| Landing `/` | 86 | 99 | 4.2s simulated (observed 0.19s) | 0 |
| Creator Home `/home` | 83 | 99 | 4.7s simulated (observed 0.24s) | 0 |
| Business Home `/business` | 90 | 99 | 3.6s simulated (observed 0.46s) | 0 |

## 7. Remaining issues that need a decision

1. A real 3D car model. The stage is ready for one; it needs a
   licensed GLB (or a scanned vehicle) to move from the isolated render
   to true 3D on the landing.
2. Photography. The Unsplash development photographs should be
   replaced with TapMart's own shoots before marketing use.
3. Loyalty and Share and earn are coming soon pages by design. The
   Wallet backend was not built (out of scope, stated in the brief for
   go live).
4. Analytics. There is no analytics route; results live on campaign
   detail, Google health and social insights. A dedicated analytics
   screen needs a data decision first.
5. From go live: the two probe branches on GitHub
   (`claude/push-probe-tmp`, `v3-release-probe`) and the release tags
   (`pre-v3-production`, `tapmart-v3-release`, local only) still need
   the founder because the session cannot delete branches or push
   tags.
6. Uploaded campaign media is served as uploaded (the seed car photo
   is a 200KB JPEG). Resizing on upload or turning on the Vercel image
   optimiser for uploads is a cost decision that would lift the phone
   Lighthouse score on Home; it is not a UI change.
7. Pre-existing: a hydration warning on the legacy `/board` page and
   the "fixture" label on the development trends provider page.
