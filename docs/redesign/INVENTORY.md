# Redesign inventory (Phase 1 audit)

Recorded before any visual change. Every route below keeps its URL,
data access, server actions, auth and permissions. The redesign touches
presentation only: tokens, shells, compositions, media, motion.

## Route groups

| Group | Layout | Shell | Notes |
| --- | --- | --- | --- |
| `/` public homepage | root | PublicNav, PublicStrip, PublicFooter (`src/v3/site/Shell.tsx`) | force-dynamic, reads plans, prices, settings |
| `(fs)` signed in product | `src/app/(fs)/layout.tsx` | FrameShiftUserShell, FrameShiftBusinessShell (`src/components/fs`) | loads frame-shift.css, v3.css, prod.css; redirects to sign in and onboarding |
| `(v2)` older signed in screens | `src/app/(v2)/layout.tsx` | UserShell, BusinessShell (`src/components/v2`) | Tailwind tokens; 14 pages redirect into `(fs)` |
| auth | root | AuthShell (`src/components/v2/AuthShell.tsx`) | sign-in, sign-up, reset, auth/reset, auth/confirm, onboarding |
| legal | root | LegalPage | terms, privacy, rules, creator-terms |
| admin | root | own pages | admin, admin/agents, admin/content, admin/hq, admin/market |
| link board (original product) | root | Header, Bar, Board | board, dashboard, earn, add, l/[slug], legacy |
| labs | gated by DESIGN_LAB | own | design-lab, design-lab-v2, design-lab-v3 (internal tooling, untouched) |
| api | none | none | 18 route handlers plus go/[placementId], s/[code], x/[slug] |

## Creator routes (personal identity)

| Route | Screen | Data and actions |
| --- | --- | --- |
| /home | Opportunities marketplace (For you, Nearby, Top pay; kinds Recreate, Story, Car; paging) | getOpportunities, getMyVehicles, SaveToggle |
| /o/[id] | Opportunity detail (Recreate, Story, Car) | RecreateDetail, StoryDetail, CarDetail, RecreateUpload, StoryControls, CarControls, RequestDecision |
| /activity | Work timeline (accepted, creating, submitted, revision, review, approved, paid) | submissions, applications, bookings |
| /earnings | Balance, pending, lifetime, payouts | PayoutRequest, earnings actions |
| /me | Profile (identity, vehicle, work, rows) | profile, vehicles, submissions |
| /me/settings, /me/edit, /me/creator, /me/instagram, /me/portfolio, /me/shoots, /me/shoots/[id] | Personal management | actions.ts per folder |
| /me/vehicles, /me/vehicles/new, /me/vehicles/[id], /me/vehicles/scan, /me/vehicles/scan/[id] | My cars: list, wizard, detail (VehicleStage, ModelViewer), guided scan | vehicles actions, scans |
| /search, /messages, /messages/[id], /alerts | Utilities | inbox actions, MarkReadOnView |
| /u/[username], /b/[slug] | Public creator and business profiles | FollowButton |
| /cars, /cars/[id], /cars/new, /jobs, /jobs/[id], /create, /wallet, /wallet/add | Redirects into the (fs) screens | none |

## Business routes (business identity)

| Route | Screen | Data and actions |
| --- | --- | --- |
| /business | Business Home (people, cars, attention, Loyalty row) | People, Cars, ShelfControls, RequestFlow |
| /business/campaigns, /business/campaigns/[id], .../submissions/[sid], .../cars/[bookingId] | Campaigns, campaign detail, review | Controls, SubmissionReview, BookingReview, CampaignSource |
| /business/create, /business/create/recreate, /story, /car | Guided builders (FlowShell, one decision at a time, ledger, review, funding) | RecreateFlow, StoryFlow, CarFlow, FundingPlane |
| /business/content, /business/content/shoots, /business/content/shoots/[id] | Content studio: library, calendar, shoots | ContentWorkspace, deliverables, publishing |
| /business/loyalty | Coming soon shell | requireBusinessContext |
| /business/brand | Brand kit with live preview | BrandKit |
| /business/profile, /business/edit, /business/new | Business profile and details | BusinessDetailsForm |
| /business/settings, /account, /security, /notifications, /connections, /connections/google | Settings | ConnectionControls, GoogleControls, IdentitySwitch, Rows, Switch, SignOut |
| /business/google, /business/social, /business/trends | Google health, social insights, trends | google actions, social actions, trends actions |
| /business/plan, /business/billing, /business/team | Plan, billing, team | PlanControls, TopUp |
| /business/people/[username], /business/cars, /business/cars/[id], /business/search | Browse people and cars | RequestFlow, cars actions |
| /business/calendar, /car-ads, /connections, /health, /review | Redirects | none |

## Shared components

- Shells: `components/fs/Shell.tsx`, `components/fs/BusinessShell.tsx`, `components/v2/Chrome.tsx`, `UserShell.tsx`, `BusinessShell.tsx`, `v3/site/Shell.tsx` (public), `v2/AuthShell.tsx`, `LegalPage.tsx`.
- Primitives: `components/fs/parts.tsx` (Mark, Wordmark, Avatar, Money, Status), `components/v2/ui.tsx` (Money, Chip, StatusChip, Avatar, EmptyState, SkeletonRows, SectionTitle, MetaLine, Stat, ScreenHeader, SurfaceRow), `v3/ui/*` (Sheet, Viewer, Img, Wordmark, Money, Edge).
- Media: `components/v2/MediaPreview.tsx`, `components/fs/Img.tsx`, `v3/LateImg.tsx`, `components/v2/vehicle/VehicleStage.tsx`, `ModelViewer.tsx` (three.js, dynamic).
- Modals, sheets, drawers: `fs-sheet`, `fs-dialog`, `fs-inspector` (native dialog), `v3/ui/Sheet.tsx`, `v3/ui/Viewer.tsx`, ReportMenu.
- Forms: BusinessDetailsForm, VehicleWizard, StoryProofForm, BookingProofForm, RecreateUpload, Uploader, FsUploader, TopUpForm, PasswordField, DollarInput, CustomChips, Presets.
- Empty and loading states: EmptyState, SkeletonRows, `loading.tsx` in 17 folders, honest empty copy per screen.
- Icons: Phosphor in 20 production files; seven Unicode glyphs used as symbols in V2 and admin screens (replaced in Phase 2).

## Data layer (untouched)

`src/lib/db.ts` (pg), `src/lib/supabase.ts`, `src/lib/auth.ts`, `src/lib/v2/*` (core, opportunities, campaigns, marketplace, requests, money, feed), `src/lib/fs/*`, `src/lib/business/*`, `src/lib/vehicles/*`, `src/lib/google/*`, `src/lib/social/*`, `src/lib/trends/*`, `src/lib/ai/*`, `src/lib/openai/*`, 38 `actions.ts` files, 18 API routes, `supabase/migrations` at 0029.

## Media on hand

`public/marketing/v3` (52 photographic files from the creative system), `public/uploads/seed`, `public/photos` (new: licensed development photography and the isolated car renders), no 3D car model, one submission video.
