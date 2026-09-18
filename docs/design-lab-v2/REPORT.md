# TapMart V2 Design Lab: report

Recorded 2026-09-16. Direction: Open Cut. Everything lives under /design-lab-v2 and docs/design-lab-v2; production is untouched. Nothing is approved for production until the founder says so.

## 1. Three directions

- **Open Cut.** TapMart is a place where ordinary things become paid opportunities: making a piece of content, posting a finished creative or offering space on a real car. Open Cut makes that conversion visible. The image carries the first impression, the amount establishes the value, and one clean edge opens the actual work. Warmth comes from people, photography and type, not friendly paragraphs or padded cards. Verdict: Kept and selected. It makes the largest structural change without making basic navigation exotic or making serious work feel like entertainment. The selected system incorporates only two narrowly useful ideas from the alternatives.
- **Night Channel.** TapMart is a series of real-world scenes in which someone can take part and earn. Night Channel turns attention into immersion: first enter the creator's scene, then inspect the opportunity and choose whether to participate. It is the boldest emotional direction, but its strength is viewing rather than marketplace comparison. Verdict: Rejected as the master direction. Merge only its focused, one-action media inspection into Open Cut: a deliberate dark viewer with proper playback controls, not a dark browsing product.
- **Market Index.** TapMart is the clearest local work market: available work, actual pay and the exact next step, without theatre. Market Index treats media as evidence and interaction as opening the relevant part of a record. It is the most efficient direction for experienced users, but it risks preserving the emotional heaviness the founder wants to remove. Verdict: Merged narrowly, otherwise rejected. Take its disciplined fact line and scroll-anchor preservation for real feed updates. Do not take its row-based primary discovery, condensed app typography or persistent inspector.

## 2. Selected direction

**Open Cut.** Open Cut best balances the founder's ten questions. Night Channel has the strongest cinematic first impression but weakens comparison, empty states and the distinction between earning types. Market Index is efficient but too close to the directory and documentation feeling being rejected. Open Cut can be immediately visual on phone, deliberately composed on desktop, inviting for both sides of the marketplace and truthful about serious money. It makes Profile into identity without inventing a portrait, gives each earning type a different physical silhouette and gives motion a semantic job. Its advantage is structural rather than a palette refresh. Selection is approval of the direction to prototype, not final approval of unbuilt screens.

Merged: From Night Channel: a focused dark media viewer entered deliberately from a reference, Story or vehicle image. This improves inspection without turning the entire app into a streaming interface.; From Market Index: disciplined factual action bands and scroll-anchor preservation when real records arrive. This improves clarity and stability without importing directory rows or a permanent enterprise-style inspector.; No merged palette, second display family, cinematic app navigation, invented creator score, equal-card grid or decorative car treatment. The selected system remains one coherent identity.

Stays from Frame Shift: The media-and-money relationship in the leading User Home opportunity. It already connects the work to its value; V2 makes the media larger and removes duplicated explanation.; The concise three-action public proposition: Recreate, Post, Drive. These remain useful public verbs, while internal kinds and workflow truth remain unchanged.; The business marketplace foundation of real people, work samples and cars. This is better than replacing Home with a management dashboard.; The distinct business actions View person and Request. One inspects the person; the other starts a real invitation. Their surrounding metadata is reduced, not their purpose.; Real financial figures, real connected-state distinctions, real vehicle photography and honest absence of 3D. These are product strengths, not disclaimers to erase.; The four Personal destinations and five Business destinations, including the separate Monthly Content destination and lime Create action. Navigation familiarity is useful; Frame Shift's particular visual treatment is not preserved.; The idea of showing genuine product UI on the public site. V2 enlarges and choreographs readable coded UI rather than relying on a tiny, text-heavy phone screenshot.

## 3 to 9. Screens

Captures for every viewport are in the published report; the lab routes render them live: /design-lab-v2, /design-lab-v2/home, /design-lab-v2/profile (alias /me, ?public=1), /design-lab-v2/business.

## 10. Motion

- Immediate navigation: Selection changes on input. New content receives a 100ms opacity transition only when already available. No slide across the viewport and no artificial loading delay. 100ms, linear. Reduced motion: Immediate replacement with no movement.
- Card becomes detail: The same media bounds expand into a full-screen phone preview. On desktop, the media expands in place while a 560px detail pane enters from the right. Title and money keep their identity and settle below the media. Animate bounds through transforms without stretching the source image. The first-phase lab opens a read-only object preview, not a fabricated complete workflow. 320 opening; 240 closingms, cubic-bezier(0.22, 1, 0.36, 1). Reduced motion: Immediate layout change with an optional 80ms crossfade; focus still moves correctly.
- Media inspection: Media expands to a contained viewport viewer on an ink background. Controls fade in over 100ms. Escape, Back and a visible Close return to the same scroll position and source element. 260ms, cubic-bezier(0.22, 1, 0.36, 1). Reduced motion: Open the viewer immediately.
- Earning edge: Only the 12px accent terminal extends to 24px along the existing 2px edge. Images do not zoom on hover. It is an interaction cue, never a payment-progress indicator. 160ms, cubic-bezier(0.2, 0, 0, 1). Reduced motion: The terminal changes colour immediately; no translation.
- Working sheet: Phone sheet enters vertically from 24px below its final position; desktop drawer enters from 32px to the right. The scrim fades over 160ms. The background remains still. Trap focus, return focus on close and confirm before discarding meaningful input. 240 opening; 180 closingms, cubic-bezier(0.22, 1, 0.36, 1). Reduced motion: Immediate appearance with focus transfer.
- Everyday to opportunity: A 92svh stage spans 160svh of document height. Progress 0–0.33 presents Recreate, 0.33–0.66 Story and 0.66–1 Car. Media moves at most 48px and resolves to its type-specific coded preview on the earning edge. Matching assets may share-transform; unrelated editorial imagery cuts to a separately labelled Product preview instead. No wheel interception, scroll locking or simulated submission-to-payment state. Below 1024px use normal vertical chapters. Scroll-driven; no clock durationms, linear scroll mapping. Reduced motion: Three ordinary vertical sections with the same content and no sticky stage.
- Business handoff: One real person preview hands off to its request composition, then a separately identified real review example. A Monthly Content panel follows as a distinct system. Desktop may use a horizontal snap strip; phone stacks panels. No automatic carousel, invented conversation or timer-driven approval. 280 for button navigation; native scrolling otherwisems, cubic-bezier(0.22, 1, 0.36, 1). Reduced motion: All panels are available as stacked sections.
- Request handoff: The action label crossfades into the returned sent state and the conversation entry appears beneath it. No flying envelope or hired celebration. On failure, preserve the form and show the real error. This mutation is disabled in the isolated lab. 220ms, cubic-bezier(0.2, 0, 0, 1). Reduced motion: Immediate Request sent or Offer sent label.
- Approval settles: The review action area collapses into a compact, explicitly named status row. Keep the reviewed media visible. Related ledger state appears only if returned by the server. No confetti, green-screen flash or automatic Paid label. Lab demonstrations require a supplied truthful recorded state sequence; otherwise show only the pre-confirmation preview. 280ms, cubic-bezier(0.22, 1, 0.36, 1). Reduced motion: Immediate state replacement with a polite accessible announcement.
- Honest balance update: Crossfade the old complete amount to the new complete amount in a fixed-width numeric area. Do not roll digits, count from zero or pre-credit money. Announce the final amount and its state once. 120ms, linear. Reduced motion: Replace the number immediately.
- Live arrival: Show a compact New opportunities control only when real new records exist. On tap, insert them with opacity and an 8px translation while preserving the scroll anchor. Never auto-scroll, recycle existing records or fabricate a live ticker. 180ms, cubic-bezier(0.2, 0, 0, 1). Reduced motion: Insert immediately after explicit refresh.
- Real vehicle invitation: The actual model yaws from 0 to 6 degrees and back to 0 once, then rests. Drag rotates yaw freely with pitch clamped from -5 to 20 degrees; arrow buttons provide equivalent 15-degree yaw steps. A photo never tilts to imitate 3D. With data saving, unsupported WebGL or a missing model, retain the real poster or photo gallery. Provider and scan details stay in vehicle management. 900 once; direct manipulation has no easingms, cubic-bezier(0.4, 0, 0.2, 1) for introduction only. Reduced motion: No introductory movement. Rotation remains available through explicit controls.

## 11. Navigation changes

- **mobile business.** Five fixed destinations, in order: Home, Content, Create, Campaigns, Business. Each occupies one fifth of the bar; all labels remain visible at 320px. Create is a 32px lime circle with an ink plus inside a 44px minimum target; it does not protrude or become a floating action button. Home has the required local tabs For you, People, Cars, Nearby, in a horizontally scrollable 40px row with no wrapping. These tabs filter the same marketplace, not separate products. Header: identity switcher left, Search, Messages and Notifications right. On Business Profile, Share and Settings replace those three utility actions; utilities remain available from the other business destinations. Review counts appear on Campaigns only when real; Content gets a real attention count, not a promotional subscription badge.
- **desktop business.** At 1024px and above, a 200px solid paper sidebar with wordmark, active-business switcher, Home, Content, one lime Create campaign action, Campaigns and Business. Create sits between Content and Campaigns and is the only filled navigation item. Search, Messages and Notifications sit at the bottom, each labelled. Campaign credit is not a dashboard tile on Home; it is accessible in Plan and Billing and at campaign funding. At 768–1023px, use an 80px rail with icons and 12px labels; Create is labelled Create. Move the full identity switcher into the main header. Home opens the marketplace directly, not an overview dashboard. Selection changes immediately; scrolling position and filter state are retained on return.
- **mobile user.** Four fixed destinations only: Home, Activity, Earnings, Profile. Each has a 22px icon, 12px label and at least a 44px target. Selected state is ink plus a 2px underline, with aria-current; no bouncing pill. Home header has the Personal identity switcher left and Search, Messages and Notifications right. Activity and Earnings use the same utilities. Profile uses the identity switcher left and Share plus Settings right, with no separate Profile title. Home has no earning-type tabs. A single Filter action opens For you, Nearby, Top pay and an optional kind selector in a sheet. Without a city, choosing Nearby requests the city there, not above the first image. Revision requests normally live in Activity and its real count badge. Only a real action due within 24 hours or a blocking financial issue earns one compact Home attention strip; show the highest-severity issue, then the nearest deadline. Never stack notices.
- **mode switching.** One identity switcher names the current context: Personal or the active business's real name and logo. It opens a bottom sheet on phone and an anchored 320px menu on larger screens, listing Personal, each permitted business and Add business. Choosing a business changes the entire navigation and active-business context; choosing Personal restores the last Personal destination. Preserve scroll positions separately per identity. Do not merge personal earnings, business campaign credit and subscription billing. Permission-restricted actions remain unavailable with a reason in their relevant flow. The isolated lab can switch between its Personal Home and Business Home previews but must not change the production session or active-business record.
- **public site.** Desktop header is 72px: TapMart left; Earn and For business anchor links centrally; Sign in and Start earning right. Phone header is 56px: TapMart left, Sign in and a 44px Menu action right. The menu contains Earn, For business and Start earning; it is not a second marketing page. Hero actions are Start earning and For business. Footer contains Terms, Privacy, Creator terms, Campaign rules and plan information. Plans are explained next to Monthly Content, not as a campaign-access paywall. Hash navigation uses native scrolling and preserves browser history. In the lab, authentication and external legal destinations open clearly labelled preview notices or supplied read-only documents rather than mutating production or pretending authentication succeeded.
- **desktop user.** At 1024px and above, a 200px sidebar contains wordmark, Personal switcher and Home, Activity, Earnings, Profile. Search, Messages and Notifications are labelled at the bottom. No settings item is scattered into the rail; Settings stays on Profile. At 768–1023px, use the 80px labelled icon rail and put the identity switcher in the main header. Main content is independently composed for desktop, not a centered phone feed. The first-phase lab implements only Public Homepage, User Home, User Profile and Business Home. Other navigation labels retain their production-intent meaning but open an Outside this preview notice; they do not lead to fabricated Activity, Earnings, Content or Campaigns screens. Shared-element object previews may open inside the four routes, but complete off-scope workflows wait for approval.

## 12. Removed from the visible UI

- User Home loses the introductory Find paid work headline, routine revision sentence, stacked discovery tabs and separate Kind control. A media-first feed, one Filter action and Activity attention counts replace them.
- Opportunity surfaces lose duplicated type labels, explanatory verb lines, View work plus Inspect reference duplication and persistent Save actions. Media opens the preview; one visible View action remains. Save moves into the object preview and saved work remains in Activity.
- Recreate retains spots and closing date next to its action. Story retains follower requirement and live duration. Car retains city, duration and monthly basis. These are not counted as expendable metadata.
- Profile loses Edit profile, verification administration, confirmation-method explanations, scan/provider language and settings-like navigation rows. It gains identity, actual work and a smaller real vehicle presentation.
- Profile connection and payout readiness survive as compact factual identity signals, not management rows. Connected is never shown without the corresponding real state. Missing Instagram displays Not connected; no fabricated handle appears. Payout ready appears only when true.
- Profile retains Earned, Completed and Rating only when backed by data. No New rating, invented review score or empty statistic card. The work gallery has no caption paragraph; selecting work reveals its full campaign context.
- Business Home loses four repetitive shelves, follower strings, verification-method strings, approval metadata and reviews beside every portrait. Work and faces lead; a real connected handle may remain. Reviews, completed work and request eligibility appear in the person preview.
- Business Home loses campaign-decision summaries and delivered-file explanations above discovery. Actual attention counts move to Campaigns and Content.
- Public loses repeated mechanism paragraphs, duplicated audience pitches and a provenance caption under every image. A compact Campaign imagery or Product preview label identifies a scene; source and capture notes open on demand.
- Plan features, platform-fee explanations, payout minimums, Google setup, brand research, vehicle processing and connection recovery leave general browsing surfaces. They remain visible at their own decision or settings point.
- No fake analytics, social engagement counters, follower-based ranking score, synthetic live activity, pretend 3D, autoplayed static reference image or celebratory money counter is added.

## 13. Moved into Settings

One administrative entrance: a 44×44 gear at the upper-right of Personal Profile and Business Profile, with the accessible name Settings. No Edit profile button or settings rows on either profile. On phones, Settings opens a full-height sheet; from 768px it opens a 480px right drawer. Rows are 56px minimum height. User Account contains identity editing, portfolio management and Vehicles, including listing, placements, asking prices and scan management. Instagram and Connections contains connection management and the distinction between API and manual confirmation. Verification contains the full verification state and corrective action. Payout contains payout setup and payout-request history; Earnings remains the destination for balances and transactions. Business Account manages the signed-in person's account; Business Details manages the selected business. Connections manages Instagram and other supported connections; Google Business is its own row, not a duplicated Google control inside Connections. Brand Kit contains sources, research status, the visual kit and separately labelled proposed changes; approval is required before changes apply. Plan and Billing contains Essential or Growth, subscription status, invoices and a distinctly separated Campaign credit section with wallet, top-ups and ledger. Team remains visible but disabled with Later until the feature actually exists. Saved belongs in Activity, public-profile sharing belongs to the profile Share action, and mode switching belongs to the identity switcher. Admin, when permitted, is a secondary Account action and is outside this exploration. Log out requires confirmation; the isolated lab never signs out the production session.

User: Account, Instagram and Connections, Verification, Payout, Notifications, Privacy, Security, Log out

Business: Account, Business Details, Connections, Google Business, Brand Kit, Plan and Billing, Team, Notifications, Security, Log out

## 14. Text density before and after

| Screen | Viewport | Words before | Words after | First screen before | First screen after | Blocks 18+ before | after | Page height before | after |
|---|---|---|---|---|---|---|---|---|---|
| Public Homepage | 390 | 995 | 180 | 42 | 21 | 9 | 0 | 11790 | 5105 |
| Public Homepage | 1440 | 987 | 136 | 78 | 25 | 10 | 0 | 13486 | 4471 |
| User Home | 390 | 199 | 56 | 90 | 33 | 0 | 0 | 2542 | 1768 |
| User Home | 1440 | 203 | 60 | 152 | 60 | 0 | 0 | 1262 | 900 |
| User Profile | 390 | 98 | 30 | 57 | 24 | 0 | 0 | 1641 | 1138 |
| User Profile | 1440 | 102 | 34 | 96 | 34 | 0 | 0 | 1076 | 900 |
| Business Home | 390 | 208 | 41 | 69 | 24 | 0 | 0 | 2601 | 1566 |
| Business Home | 1440 | 249 | 53 | 245 | 39 | 0 | 0 | 960 | 1028 |

## 15. Astra's final scores

| Question | Public Homepage | User Home | User Profile | Business Home |
|---|---|---|---|---|
| Premium modern product | 8 | 8 | 8 | 8 |
| Explains itself without paragraphs | 9 | 9 | 9 | 9 |
| Consumer platform, not business software | 9 | 9 | 9 | 9 |
| Memorable | 8 | 8 | 8 | 8 |
| Motion improves understanding | 6 | 7 | 5 | 4 |
| Each earning type feels different | 8 | 9 | 9 | 8 |
| Business discovery exciting | 7 | 5 | 7 | 8 |
| Profile is identity, not settings | 0 | 5 | 10 | 0 |
| Website keeps you scrolling | 8 | 5 | 8 | 0 |
| Stronger than production | 9 | 9 | 9 | 9 |
| Text discipline | 9 | 9 | 10 | 10 |
| Truthfulness | 8 | 9 | 9 | 9 |
| Slop risk (0 is none) | 2 | 1 | 2 | 2 |
| Verdict | fix (public-home-pass2) | fix (user-home-pass3) | fix (user-profile-pass2) | fix (business-home-pass3) |

## 16. Why better than production (Astra)

**Public Homepage.** Production asks people to read an explanation and inspect a miniature phone interface. This version shows the proposition immediately: someone filming, a Story on a phone, and advertising on a car. The earning examples are readable at human scale, with approval conditions attached to the money. Businesses meet a person and their work rather than a software dashboard. Measured phone copy falls from 995 to 180 words, and the page is less than half its previous height. The warm canvas, distinctive typography and straight earning edge give TapMart an identity beyond blue buttons. This is a substantial structural improvement. The direction is approved; the remaining control and layout defects prevent final screen approval.

**User Home.** Production makes people work through navigation, instructions and small thumbnails to understand an opportunity. This version puts the work, its payment conditions and one View action together. Desktop presents three clearly different ways to earn in one deliberate composition; phone gives the leading opportunity room to be understood. Default copy falls from 199 to 57 words on phone and 203 to 60 on desktop. The familiar four destinations remain. This is a substantial improvement in clarity and character, with two rendering defects still preventing final approval.

**User Profile.** Production makes the profile feel like an account page: editing, connection details and vehicle management compete with small work thumbnails. V2 starts with a person and their work. Earnings have one clear label, the listed car is secondary, and administration has one entrance. Measured interface copy falls from 98 to 30 words on phone and 102 to 34 on desktop without losing the four familiar destinations. Desktop is genuinely composed for its width rather than stretching the phone layout. This is a substantial improvement, not just a colour change. The remaining corrections are surgical; do not recompose it.

**Business Home.** Production makes you read through notices, tiny work thumbnails and repeated metadata before choosing someone. This version leads with a face and work you can actually judge. Request starts an invitation; View person lets you inspect first. Cars have a different shape, a clearly monthly asking rate and a named placement. The supplied counts fall from 208 to 41 words on phone and 249 to 53 on desktop, without removing those essential distinctions. It is substantially more inviting and understandable—not just a colour refresh. Three finish issues prevent final approval.

## 17. Files and routes

Routes: /design-lab-v2, /design-lab-v2/home, /design-lab-v2/profile, /design-lab-v2/me, /design-lab-v2/business (404 in production unless DESIGN_LAB=1).

- src/app/design-lab-v2/Img.tsx
- src/app/design-lab-v2/Outside.tsx
- src/app/design-lab-v2/Preview.tsx
- src/app/design-lab-v2/Sheet.tsx
- src/app/design-lab-v2/Switcher.tsx
- src/app/design-lab-v2/Viewer.tsx
- src/app/design-lab-v2/business/Discovery.tsx
- src/app/design-lab-v2/business/page.tsx
- src/app/design-lab-v2/fixtures.ts
- src/app/design-lab-v2/home/Feed.tsx
- src/app/design-lab-v2/home/Opportunity.tsx
- src/app/design-lab-v2/home/page.tsx
- src/app/design-lab-v2/layout.tsx
- src/app/design-lab-v2/me/page.tsx
- src/app/design-lab-v2/page.tsx
- src/app/design-lab-v2/parts.tsx
- src/app/design-lab-v2/profile/Profile.tsx
- src/app/design-lab-v2/profile/page.tsx
- src/app/design-lab-v2/site/Site.tsx
- src/app/design-lab-v2/v2.css

Fixture media rendered for the lab:

- public/design-lab-v2/assets/eli-work-bag-01.jpg
- public/design-lab-v2/assets/eli-work-cup-02.jpg
- public/design-lab-v2/assets/maya-loopday-submission-01.jpg
- public/design-lab-v2/assets/maya-spurroom-placement-01.jpg
- public/design-lab-v2/assets/maya-work-cup-02.jpg
- public/design-lab-v2/assets/maya-work-pour-01.jpg
- public/design-lab-v2/assets/nora-work-chain-01.jpg
- public/design-lab-v2/assets/nora-work-wheel-02.jpg

Director tooling: src/lib/openai/v2.ts, scripts/creative.ts (v2-directions, v2-screen, v2-review).

Gates: tsc clean; eslint clean on the lab and touched files (one pre-existing warning in src/lib/openai/creative.ts, untouched); vitest 140 of 140; next build succeeded.

