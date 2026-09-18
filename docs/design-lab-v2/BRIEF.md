# TapMart V2 Design Lab: the brief

Recorded 2026-09-16 from the founder's instruction. This is the charter for
everything under /design-lab-v2. Nothing here changes production.

## Scope and guardrails

- A new, isolated design environment at /design-lab-v2. It renders in
  development (or with DESIGN_LAB=1) and returns 404 in production.
- Production UI (Frame Shift), backend behaviour, legacy code and the live
  product are not modified. The live product stays the fallback.
- First phase only: four experiences. Public Homepage, User Home, User
  Profile, Business Home. Everything else waits for approval.
- STOP after the V2 Design Lab report. Nothing is implemented in
  production before the founder approves.

## Why

The current product works and is approved, but it feels heavy: too much
text, over explanation, scattered settings, a Profile that reads like
settings, screens that read like documentation, a public site that explains
instead of shows, conservative animation, not enough visual personality.
TapMart should feel simple, fast, visual, premium, alive, modern, consumer
quality and memorable, while keeping serious business functionality.

## Benchmark

Artec (artec.app) is the quality benchmark for creator experience, brand
experience, public site, mobile and desktop presentation, transitions,
campaign discovery, earnings presentation, profile structure, work
presentation, navigation, messaging, how little text it uses, product
visuals, device screenshots, section choreography, typography, spacing,
rhythm and information on demand. TapMart stays its own product. Frame
Shift is not preserved because it was built; keep only what is excellent.

## Product truth (does not change)

- Two modes: Personal (User) and Business.
- User earning types: Recreate, Story, Car. States: application, booking,
  installation, proof, monthly payment where they apply.
- User navigation: Home, Activity, Earnings, Profile. No extra primary nav.
- Business systems: A. Campaigns (find people, find cars, create Recreate,
  Story and Car campaigns, review applications, submissions, proof,
  installation, payments). B. Monthly Content (photo and video shoots,
  delivered content, review, approval, scheduling; plans Essential and
  Growth; campaign spending is separate from the subscription).
- Smart Vehicle: interactive 3D only when a real model exists; otherwise
  real photography. Never fake 3D.

## Design philosophy

SHOW FIRST. ACTION SECOND. DETAILS ON DEMAND.

Dramatically less visible copy. Never hide money, deadlines, financial
consequences, eligibility, important requirements, approval consequences,
legal or usage terms, or payment state: they appear at the point of need.
The product stays truthful.

Example discovery card: [REFERENCE MEDIA] / $75 / Employee POV / Demo
Coffee Co. / View.

## Profile is identity, not settings

Photo, name, location, earnings, completed work, rating, work and media,
Instagram, vehicle, possibly a premium Smart Vehicle moment. Everything
administrative lives behind ONE settings action.

## Settings architecture (consolidated)

- User: Account, Instagram and Connections, Verification, Payout,
  Notifications, Privacy, Security, Log out.
- Business: Account, Business Details, Connections, Google Business, Brand
  Kit, Plan and Billing, Team, Notifications, Security, Log out.

## Public website

A visual story, not documentation. Opening line open (for example "EARN
FROM WHAT YOU ALREADY HAVE." or "RECREATE. POST. DRIVE. GET PAID." or
stronger). Three earning modes communicated visually: Recreate (reference
reel, creator filming, submission, money); Post (Story creative, phone,
posted state, proof, money); Drive (real vehicle, placement, campaign,
monthly payment). Motion, real UI, video, photography, device frames,
interactive transitions, scroll choreography, 3D only if meaningful,
depth, layering. Business story: FIND PEOPLE, FIND CARS, CREATE CAMPAIGN,
REVIEW WORK, MONTHLY CONTENT, told through product interaction, no
paragraphs.

## Motion is a major design tool

Screen transitions, shared element transitions, media expansion, cards
becoming detail screens, device choreography, scroll linked transitions,
horizontal storytelling, live feed motion, animated balances and state
changes where appropriate, car interaction, image to interface
transformations, approval transitions. Money is never animated
misleadingly. Basic navigation is never slowed.

## Visual freedom

Colours, light or dark, typography, logo treatment, spacing, layout,
navigation presentation, image treatment, motion, 3D, surfaces, device
frames, backgrounds, iconography, density and composition may all be
rethought. Cobalt, mineral, graphite and the Frame Shift geometry need not
remain. Keep what is excellent.

Do not chase "futuristic": no random gradients, AI purple, neon
everywhere, glass everywhere, floating blobs, meaningless 3D, huge rounded
SaaS cards, generic bento grids, fake analytics, fake product states.

## Media

Real photography, creator media, Story creative, cars, business content,
product UI. Generated visuals are allowed for design exploration and
marketing imagery. The final app UI is real coded UI; no image generated
screenshot is ever the interface.

## Tools and roles

Astra (the strongest OpenAI reasoning model) directs creative, UX, product
design, hierarchy, information architecture, animation and critique, and
gives the final review. Image models render campaign media, photography
concepts, marketing environments and assets. Claude Code writes the code
(React, CSS, interaction, responsive, state, accessibility). The browser
takes real screenshots and tests motion.

## Process

1. Study Artec deeply. 2. Study the current live TapMart. 3. Study the
backend and flows. 4. Identify what makes TapMart heavy. 5. Explore at
least three substantially different V2 directions (composition, motion,
navigation feel, media use, identity, interaction philosophy). Astra
chooses the strongest. Then, per experience: Astra art directs, Claude
builds real UI, browser screenshot and motion check, Astra reviews, Claude
fixes, second real capture, Astra final review.

Responsive: 390, 320, tablet, 1440, large desktop. Desktop is composed,
not a shrunk or stretched phone.

## Quality bar

Premium modern product? Explains itself without paragraphs? Consumer
platform, not business software? Memorable? Motion improves
understanding? Each earning type feels different? Business discovery
exciting? Profile identity, not settings? Website makes someone keep
scrolling? Significantly stronger than current production?

## Deliverable

1 three directions Astra explored, 2 selected direction and why, 3 Public
Homepage desktop, 4 Public Homepage mobile, 5 User Home mobile, 6 User
Home desktop, 7 User Profile mobile, 8 Business Home desktop, 9 Business
Home mobile, 10 key motion recordings or descriptions, 11 navigation
changes, 12 what left the visible UI, 13 what moved into Settings, 14
before and after text density, 15 Astra's final scores, 16 Astra's
explanation of why this is better than production, 17 exact files and
routes created inside /design-lab-v2. Then STOP and wait for approval.
