# TapMart Loyalty: V3 Design Lab report

Recorded 2026-09-17. Everything lives under /design-lab-v3 and docs/design-lab-v3. Production routes, the live database, migrations, Wallet APIs, notification delivery and the live UI are untouched. All members, counts and sources are fictional fixture state. Nothing is approved for production until the founder says so.

Published report with every capture and recording: https://claude.ai/artifact/XY1Gh5oGma4iLvji7fcrz2

## 1. Where Loyalty lives

Loyalty belongs to the business itself, not to a fourth campaign type or a new Growth destination. Its permanent home is Business → Loyalty, as the first operational row below the brand profile. A shallow, unmistakable entry inside Business Home makes it discoverable without converting the marketplace into a dashboard. Home still answers who can advertise for me; Loyalty answers who joined and came back. This preserves the five-destination mental model while making daily counter work one tap from its Home entry.

Keep the marketplace opening exactly as built: Maya's face and work, plus Eli's car. On phone, insert one Loyalty strip after the complete car action band and before Nora. On desktop, insert it across the full content width below the lead person/car action bands and above the lower people roster. It is not an attention banner above discovery. Use 1px top and bottom separators, no enclosing card, no shadow and no new background. At 1440 it is 1176px wide and approximately 104px high; at 1920 it stays within the existing 1280px app maximum. At 390 it is 358px wide and approximately 132px high; at 320 it can grow to 152px rather than squeeze type. A 56px square crop of the program's actual artwork and loop mark sits left; this is an artwork fragment, not a tiny unreadable Wallet screenshot or QR. Copy: Loyalty / 10 members · 6 came back / Open loyalty. Open loyalty is a quiet 44px action. Show only these two counts here; the four-count overview belongs one tap away. No program: Loyalty / Turn visits into rewards. / Create program, with the brand mark instead of a pretend card. Draft: Loyalty / Draft · Free coffee / Continue setup. Live without members: Loyalty / 0 members · 0 came back / View QR. Keep the same insertion point in every marketplace filter; the strip is a business tool, not a People or Cars result.

Navigation changes:
- None to the five primary destinations: Home, Content, Create, Campaigns, Business.
- None to the 200px desktop sidebar, 80px tablet rail or five-item phone bar. Reuse the as-built V2 Phosphor regular icon set; do not introduce a second library.
- Business becomes an implemented V3 supporting profile destination and contains the Loyalty row. Loyalty routes keep Business selected; desktop breadcrumb is Business / Loyalty. Do not add a sixth rail icon, nested permanent rail menu or Loyalty notification badge.
- The consolidated Settings list remains Account, Business Details, Connections, Google Business, Brand Kit, Plan and Billing, Team, Notifications, Security, Log out. Loyalty is not buried in Settings and does not add another Settings row.
- Counter, creation and customer signup are focused tasks. The business bar remains on overview/list pages; full-height recording and creation can cover it while providing Back and Close. Customer routes never show business navigation.

Routes:
- /design-lab-v3, the V3 public homepage. Carry V2 forward and add the Loyalty sequence inside its business chapter.
- /design-lab-v3/home, the unchanged-in-intent V2 Personal Home copied into V3. All internal preview links remain inside V3.
- /design-lab-v3/profile, the V2 Personal Profile copied into V3. No Loyalty member identities or business customer records enter Personal mode.
- /design-lab-v3/business, the V2 marketplace with the specified Loyalty strip. Preserve its people, cars, filters, attention counts and request boundaries.
- /design-lab-v3/business/profile, the supporting Business destination: existing brand-profile language, cover, loop logo, Loopday Coffee, Coffee shop · Austin, Share and Settings. The first operational row below brand identity is Loyalty, with 10 members · 6 came back. Do not fabricate plan, shoot or active-campaign facts to fill an overview.
- /design-lab-v3/business/loyalty, Loyalty Home and its no-program, draft and live states.
- /design-lab-v3/business/loyalty/create?step=program|reward|card|signup|launch, one five-step wizard. Direct entry to a later step validates prerequisites. With a live program, show Loopday already has a live program. and View program; a separate Lab action can start the blank creation scenario.
- /design-lab-v3/business/loyalty/program, the live rule, terms and card previews. edit=reward and edit=card open contextual editing sheets. Program type is fixed after launch.
- /design-lab-v3/business/loyalty/qr, the counter signup QR, local shareable link and launch tools. view=print opens the labelled demo printout, not a new application route.
- /design-lab-v3/business/loyalty/members, member list. filter=repeat|ready|redeemed and source=<fixture-source-id> are views over the same local projections. view=redemptions lists reward-redemption events rather than pretending their total is a unique-member count.
- /design-lab-v3/business/loyalty/members/:memberId, member detail, immutable acquisition source, counted and uncounted history, earned rewards and Wallet state.
- /design-lab-v3/business/loyalty/record, counter recording. member=<fixture-id> preselects a member only after an explicit business action. Scan and Search remain modes of this route.
- /design-lab-v3/business/loyalty/attribution, the complete source descent. source=<fixture-source-id> opens one source's explanation and business-only member drill-down.
- /design-lab-v3/business/loyalty/updates, automatic and business-authored Wallet update history, explicitly simulated.
- /design-lab-v3/business/loyalty/updates/new, compose, preview and simulate one business Wallet update. Review is a step of this route, not a separate notification product.
- /design-lab-v3/c/:linkCode, a fixture campaign-link handoff. The code resolves through the fixture link registry, records an explicitly simulated trusted-link click after deliberate activation, and opens the appropriate signup. Arbitrary URL creator parameters cannot grant attribution.
- /design-lab-v3/join/:joinCode, public customer signup. loopday-counter maps to BUSINESS_QR; loopday-jasmine-story, loopday-maya-recreate and loopday-eli-car map to their source objects; loopday-direct is the plain, untracked signup entry.
- /design-lab-v3/card/:memberCode?platform=apple|google, the responsive Wallet concept wrapper. The opaque demo member code is distinct from both a signup QR and the readable member ID. Details opens within this route. Saving is simulated; no .pkpass or Google save JWT is produced.
- All additional overlays use these routes or in-route state. Content, campaign Create, Campaigns, Messages, Notifications and unimplemented Settings destinations retain their V2 meanings but open Outside this preview / This destination is outside the V3 lab. They do not navigate to production. Browser Back closes the top layer before leaving its parent.
- The persistent Design Lab control opens scenario selection and Reset demo. Scenarios: Live program, No program, Draft, Live · no members, Points · 82 of 100, Points · 99 of 100, Same-day visit, Wallet not added, Google limit reached, Recording error. Changing a scenario asks Change demo state? / This resets local changes. / Cancel / Change state. These are replacement fixture contexts, not additional live programs.
- Documentation is not navigation: produce docs/design-lab-v3/LOYALTY_ARCHITECTURE.md, WALLET_RESEARCH.md, PRIVACY.md, MVP_VS_LATER.md and REPORT.md. The architecture must retain the brief's purpose, fields, relationships and MVP/future distinction for loyalty_programs, loyalty_members, loyalty_rewards, loyalty_member_progress, loyalty_events, loyalty_attribution, wallet_passes, wallet_pass_registrations and wallet_updates.
- Architecture refinements: distinguish versioned reward definitions from earned member reward instances; add loyalty_member_rewards with member, reward version, unlock event, consumed credits, status and redemption event. Preserve additional progress rather than resetting it destructively. Record business timezone, counted delta, qualifying-visit identity, staff actor and idempotency key on counter events. A positive POINTS_ADDED event must contribute a qualifying visit day so points members can be measured as repeat visitors.
- Architecture refinements: immutable attribution includes source type, campaign, creator, link or QR, first-touch time, signup time, session and confidence. A unique program/contact identity prevents duplicate signups. Preserve the first known source through signup; later touches are separate events. Production session signing and identity verification are design requirements, not integrations built by V3.
- Wallet documentation must distinguish a save action opened from a confirmed save, an update submitted from delivery, and a notification request from a notification seen. Preserve the research's source-access limitations and unverified 2026 claims; do not relabel them newly verified. REPORT.md contains route inventory, actual browser captures, text counts, normal/reduced-motion recordings, event/count checks and unresolved issues. Stop for approval.

## 2 and 3. Loyalty Home

- Header: Loyalty, with Add visit as the single filled action. In a points program, the action is Add points. Business remains the selected primary destination.
- First: four counts directly on paper, in this order: Members, Repeat visitors, Rewards ready, Rewards redeemed. No statistic cards, trends or comparison periods.
- Second: Recent customers. Show three compact, operable rows with first name and progress or reward state. No invented portraits, contact details or source explanations in these rows.
- Third: the program. Show its actual brand artwork, Free coffee, 5 visits and Live. This is the rule, not an average member's progress. View program reveals the card and program controls.
- Fourth: Joined from. Show the leading source, Jasmine · Story campaign, with 4 Joined, 3 Came back, 1 Redeemed as a small descent. View attribution opens the complete comparison.
- Last: quiet working actions. View QR, Members and Send update are secondary. Do not arrange five equally prominent buttons across the top.
- Edit reward is on demand inside View program. Card editing and program terms live there too, not in general Business Settings.
- State-dependent primary action: Create program when absent; Continue setup for a draft; View QR when live with no members; Add visit or Add points once members exist.

## 4. Create program

Five steps: Program, Reward, Card, Signup, Launch. Direct entry to a later step validates the earlier ones. Launch produces a simulated live program with zero members.

## 5. Card designer

Draw a conventional Apple Wallet store-card concept, not an invented 2026 layout. Use a 375px reference width and an approximately 500 to 540px content-led height, with a restrained platform-like 12px pass boundary; this is the sole card-shape exception, not a new app container style. At top, a compact loop logo and Loopday Coffee logo text. Use a 375:123 strip artwork area behind the one primary field. Compose the actual Loopday photo on the right and a solid brand-color reading area on the left; no gradient is needed to make text legible. Primary: VISITS / 3 of 5, or POINTS / 82 of 100. Under it use three combined secondary/auxiliary fields: REWARD / Free coffee, MEMBER / Sara, STATUS / Collecting. This remains within the square-barcode store-card field budget. Put a black-on-white member QR below, with a four-module quiet zone, plus readable member ID LD-001. Never place a logo over the QR. Back fields contain Reward, Requirement, Terms, Member ID and Offer when present. Do not use a generic-pass background image, arbitrary web progress controls, a front Redeem button, featured actions or an embedded tap target that Apple has not been verified to support. The wrapper, not the pass, supplies Details, platform switching and lab controls. Typography approximates platform rendering with the system font rather than pretending Wallet uses TapMart's Bricolage.

Draw a Google Wallet loyalty-card concept, not a recolored Apple pass. Use the circular loop logo, Loopday Rewards as the program name, Loopday Coffee as issuer identity, and a wide approximately 3:1 hero image using the verified Loopday photo. Below, show the supported Visits or Points balance beside Rewards. Then Member / Sara and Member ID / LD-001, followed by the same member's black-on-white QR with a proper quiet zone. Requirement, reward status, terms and the current offer live in supported text modules/details. Use Google's hex background-color model and platform-like spacing/system typography. Keep essential labels and values outside imagery. No tiers row, Smart Tap action, rotating QR, NFC symbol or fabricated proprietary native control. The platform's exact rendering is not guaranteed by this concept; the adjacent Design Lab label makes that explicit.

Immediately above every Apple specimen: Design Lab · Apple Wallet concept. Immediately above every Google specimen: Design Lab · Google Wallet concept. Immediately below: No pass is issued. Creation specimens additionally say Example member · Sara. State selectors never imply a real card changed. Saving uses Apple Wallet add simulated. or Google Wallet add simulated., with Nothing was added to your device.

## 6. Customer QR

Counter QR for signup; member QR on each card for recording. Payloads are lab strings.

## 7. Signup

A known Jasmine acquisition shows one quiet line above the reward: From Jasmine’s Story. A known counter acquisition shows Join at the counter. Direct signup shows no invented referrer; source details later say Direct signup / Source not tracked. These are acknowledgment, not referral-discount promises. A prior known TapMart source carried in the same fixture session wins even if the final arrival is through the counter QR. The page uses the preserved acquisition source, not the last visible URL. Never ask How did you hear about us? in this MVP.

Fields: First name, required, 1 to 40 characters after trimming. No surname, username, birthday, password or TapMart account., Email or Phone, exactly one required contact. Email is selected initially; Use phone swaps the field, and Use email swaps it back. Phone exposes a country-code selector, defaulting to United States +1 for the fixture, without assuming the customer's device location., The contact is normalized for same-program deduplication. It is unverified in the concept. Never claim a code was sent or that a recovery flow works., One unchecked required agreement: I agree to the demo program terms and privacy notice. The links open explicitly labelled demo documents. There is no marketing checkbox because the MVP has no contact-marketing channel., A separate Lab helper, Use demo details, fills Tess and tess@example.test after a tap. It does not select the agreement or submit the form..

## 8 and 9. Wallet concept states

Apple store card concept and Google loyalty card concept in collecting, reward ready, reward redeemed and updated offer states. Labelled Design Lab concepts; no pass is issued. Google notification requests are capped at three per pass per 24 hours.

## 10 and 11. Members

Roster with search, scan, and filters (All, Repeat visitors, Reward ready); detail with progress, member QR, counter actions, source, Wallet and history. Desktop shows the roster and the selected member side by side.

## 12 and 13. Recording, unlock, redeem

After the qualifying event commits to local fixture state, the final progress mark completes and Reward ready replaces the ordinary progress caption. Keep the member's name and QR stable. Show Free coffee and an immediately available Redeem action; do not open a celebratory modal. Sara's fifth visit changes the default counts to 10 Members, 6 Repeat visitors, 2 Rewards ready, 2 Rewards redeemed. Her Apple concept changes to VISITS: 5 of 5 and STATUS: Reward ready. The adjacent business receipt says Wallet update simulated. Redeem opens a small confirmation: Redeem Free coffee? / Use one ready reward. This does not add a visit. / Cancel / Redeem reward. Confirmation consumes that specific earned reward, appends the redemption event and shows Reward redeemed. Sara then has 0 of 5 visits, five lifetime counted visits and one redemption. Counts become 10, 6, 1, 3; Jasmine's source becomes 4 Joined, 3 Came back, 2 Redeemed. Apple may use a time-critical change message; Google may notify within its shared notification allowance. Nothing is delivered by the lab. Do not discard extra progress earned while a reward was waiting: consume only the credits attached to the redeemed reward and retain subsequent progress.

Same day: Already counted today. / 2 of 5 visits · unchanged / One visit counts per day. / Done / Next customer. For Imani, the detail is Last counted today at 9:10 AM. A fresh second attempt is recorded as an uncounted same-day event; a duplicate request with the same idempotency key produces no additional event. Neither changes progress, repeat counts, reward counts or Wallet content. Use the business's America/Chicago calendar day, not the scanning device's timezone. The points equivalent is Already counted today. / 82 of 100 points · unchanged / One qualifying purchase counts per day.

## 14. Attribution

Use an open, descending three-step composition: Joined, Came back, Redeemed. Each step is a horizontal ink rule with a solid measured length and its count outside the rule, aligned to a fixed text column. Right edges descend as counts narrow; left edges share a datum. Use a brick terminal only to connect this to Open Cut, not as an extra metric. The overall descent is 10 → 6 → 2. Below, source objects are stacked without boxes: identity at left, three measured ledges at right on desktop; identity above the ledges on phone. All source objects use one common scale based on the largest joined source, four members in this fixture. Do not normalize every source to its own 100%, invent a minimum-width zero bar or put tiny labels inside narrow bars. A zero is an empty rule with 0 outside. Default order is Came back descending, then Joined descending, then name. Never show a spreadsheet, revenue, ROI, order value, impressions-to-sales estimates, invented conversion percentages, causal lift or inferred offline exposure. Joined is a signup, not a verified purchase. Came back requires counted activity on two distinct business days. Redeemed is unique members who redeemed at least once, not the number of redemptions.

Each object contains a human source name, campaign name and kind when known, then three unique-member counts. Example: Jasmine / Morning loop · Story campaign / 4 Joined / 3 Came back / 1 Redeemed. Tap opens Source details: Joined from, the immutable source classification, named link or QR, known first-touch time, signup range and the definition of each count. A business-only View members action opens the corresponding filtered member list. Direct signup is explicitly Source not tracked. Counter QR is a known entry mechanism, not proof that a creator had no earlier offline influence. Creators are absent from this MVP's operational routes; any future creator response contains only aggregates for their own links, never names, contacts, individual timestamps or a customer drill-down.

## 15. Public website animation

Inside the existing dark For businesses chapter, after the marketplace's people/car/create/review demonstration and before Monthly Content returns to paper. Replace the current chapter's empty closing shoulder and duplicate Open preview ending with this third-act sequence. Do not move Loyalty into the earning hero or imply that Monthly Content subscriptions include campaign spend. The V3 page becomes longer; measure and report the new document height and complete copy count rather than pretending the old four-surface V2 budget was met unchanged.

Phone: Use one readable stage in ordinary document flow, approximately 620 to 740px tall depending on viewport and text. No phone scroll pinning. Story, Signup and Reward are chapter-jump controls; Previous and Next expose all eight frames. Play sequence runs the 7300ms sequence only after a tap, with Pause always visible, then rests at the final frame. At 390 the card uses the available 358px width; at 320 remove decorative device framing entirely and use the 296px responsive concept. The stage's product UI is illustrative and non-interactive; Open loyalty preview opens the unscaled working product. Do not cram the business navigation or a whole dashboard into the frame.

Desktop: At 1440 and 1920, extend the existing ink business chapter with a bounded 160svh native-scroll region. Its sticky stage is capped at 720px high at 1440 and 800px at 1920, always below the 72px public header. Map normalized native scroll to the same 7300ms storyboard; these timings define relative narrative weight, not forced waiting. No wheel interception or scroll lock. Keep content within the existing 1376px/1600px public maxima and cap the narrative composition at 1280px. The Story occupies a real 9:16 media region; the card remains approximately 375px wide at readable scale, not a wall-sized fake Wallet. At most one abstract phone viewport is permitted, with no notch, clock, signal or OS sheet. The source media remains unframed. Chapter controls, Previous and Next work independently of scroll; explicit playback pauses on scroll input. Extra 1920 width supplies breathing room, not another dashboard.

Reduced motion: Remove sticky mapping, translations and playback. Present the same eight states as ordinary labelled sections, grouping the three return dates compactly while preserving their values. All source, platform and simulation labels remain. Previous/Next become native section links. No information depends on seeing a moving card or a notification.

## 16 to 19. Documents

- docs/design-lab-v3/LOYALTY_ARCHITECTURE.md
- docs/design-lab-v3/WALLET_RESEARCH.md
- docs/design-lab-v3/PRIVACY.md
- docs/design-lab-v3/MVP_VS_LATER.md
- docs/design-lab-v3/LOYALTY_DIRECTION.md and screens/*.md (Astra's direction and screen designs)
- docs/design-lab-v3/reviews/*.md (Astra's review passes)

## 20. Astra's final verdict

| Question | Business Home with Loyalty | Loyalty Home | Create program | Customer signup and Wallet card | Members and recording | Attribution | Public site sequence |
|---|---|---|---|---|---|---|---|
| Premium modern product | 8 | 8 | 6 | 6 | 7 | 7 | 5 |
| Explains itself | 9 | 9 | 7 | 8 | 8 | 8 | 6 |
| Consumer product, not software | 9 | 8 | 7 | 8 | 7 | 7 | 8 |
| Memorable | 8 | 7 | 6 | 7 | 6 | 7 | 5 |
| Motion improves understanding | 0 | 0 | 0 | 3 | 5 | 0 | 6 |
| Natural part of TapMart | 9 | 9 | 8 | 8 | 8 | 9 | 8 |
| Business value obvious | 8 | 9 | 8 | 8 | 8 | 9 | 8 |
| Quick to understand | 9 | 9 | 8 | 8 | 8 | 8 | 6 |
| Attribution honest and powerful | 6 | 9 | 3 | 6 | 7 | 6 | 6 |
| Wallet realism | 0 | 0 | 6 | 5 | 3 | 0 | 4 |
| Text discipline | 9 | 9 | 7 | 6 | 7 | 7 | 7 |
| Truthfulness | 9 | 9 | 8 | 7 | 8 | 6 | 7 |
| Slop risk (0 is none) | 1 | 2 | 3 | 4 | 2 | 3 | 3 |
| Verdict | fix (pass 2) | fix (pass 2) | fix (pass 2) | fix (pass 2) | fix (pass 2) | fix (pass 2) | fix (pass 2) |

**Business Home with Loyalty.** Find a person or car to advertise Loopday. Further down, Loyalty is already part of this business: ten members, six came back, Open loyalty.

**Loyalty Home.** Ten members, six repeat visitors, one reward ready and two redeemed. Add the next visit.

**Create program.** Choose visits or points, offer a free coffee after five visits, make the card yours, then launch a clearly simulated signup QR.

**Customer signup and Wallet card.** Loopday offers a free coffee after five qualifying visits. Join with a name and one contact, then receive a demo member card. The reward is immediately understandable; the Apple card's narrow layout is immediately noticeable too.

**Members and recording.** Find Sara. She has four of five visits toward a free coffee. Count the next visit; a reward becomes ready. Her member record connects her to Jasmine’s Story.

**Attribution.** Ten joined, six came back, two redeemed. Jasmine has the most returners; both of Maya’s members returned.

**Public site sequence.** A coffee campaign leads to Sara’s card, repeat visits and a free coffee. Desktop keeps Jasmine attached; phone currently reads as a Wallet demo without that source connection.

### Finishing round after pass 2

Every surface came back "fix" on the final pass, none "recompose": one finishing round, no third pass. Requests for additional viewport captures (320, 768, 1023, 1920), keyboard, 200% zoom, Back and scroll restoration checks are acceptance evidence, not design changes; the report includes the 320 to 1920 captures that exist and the fixture checks.

**Business Home with Loyalty.** Applied: Desktop strip gaps set to 24px above and 32px below the seam. Left: Eli work stills: verified in the V2 fixture as Eli's own Recreate stills for Loopday (eli-work-bag-01, eli-work-cup-02), not Maya's; unchanged.

**Loyalty Home.** Applied: Phone source order is now Joined from, identity, three lanes, then View attribution. Loop mark redrawn: 40 degree opening at the upper right, terminal on the tangent of the lower edge. Left: Header action centering: the 56px header already centres a 44px action; unchanged.

**Create program.** Applied: Removed the "Visits datum" caption; renamed the optional group "Additional terms · Optional". Left: Desktop 1176px task composition, phone brand strip and 76px action band: larger recompositions left for the production build. Crop action opening a per platform window: left for the production build.

**Customer signup and Wallet card.** Applied: Wallet passes now fill the phone width (358px at 390) instead of collapsing to about 210px. One issuance caption in the initial action state; Done appears only after a save or Not now. Removed the ordinary-progress sentence above the platform tabs. Left: Member QR payload stays the opaque member code rather than a full URL: the counter scanner reads the code; the decoded value is recorded below. Updated offer layered over Reward ready: left for the production build.

**Members and recording.** Applied: Removed the Name column heading and the bottom Members link on the phone detail. Desktop Members header shows a quiet Scan action; the filled Add visit stays on phone; the duplicate Scan beside search is gone. Left: Recognition region reorder (name first, QR beneath), Details on receipts, View demo card under the Wallet summary: left for the production build. Member QR version pinning: the code encodes at the smallest version that fits; decoding verified below.

**Attribution.** Applied: First touch is now only ever a recorded campaign click and reads Not recorded otherwise; the link is named by campaign; Confidence reads Source confidence. Left: Full width desktop source rows with a 600px plotting lane, Signup period as label plus value, drawer reordering: left for the production build.

**Public site sequence.** Applied: The Apple concept fills the phone width in every replay scene, with a 1px paper outline on ink. Final receipt typography: Sara 20/26, 5 of 5 visits 24/28, Reward ready 28/32 on its own line, Free coffee 18/24. Left: Removing act headlines from Wallet scenes and the larger Story dimensions: kept as directed in the original storyboard; left for a later pass.

## Fixture checks

- counts at start (members/repeat/ready/redeemed): 10/6/1/2
- Sara after +1 visit: Reward ready
- counts after Sara's fifth visit: 10/6/2/2
- Mina after Redeem: Reward redeemed
- counts after Mina redeemed: 10/6/1/3
- Imani: +1 visit pressed again today: Already counted today. (no visit added)
- counts after same-day attempt: 10/6/1/3
- Sara signs up again at the counter: Already a member in this preview. (no duplicate member, no source overwrite)
- counts after duplicate attempt: 10/6/1/3
- Sara's first known source after the counter attempt: Jasmine · Story campaign (preserved)
- page errors: none
- member QR decoded from Sara's detail: LMQ-7K2P-SARA (her member code)
- Apple concept QR decoded from Sara's card: LMQ-7K2P-SARA (same code, so the counter recognises the card)
- counter QR decoded: the counter signup link, /design-lab-v3/join/loopday-counter

## Gates

- tsc: clean
- eslint on src/app/design-lab-v3 and src/lib/openai/v3.ts: clean
- vitest: 140 of 140
- next build: compiled successfully; 18 design-lab-v3 routes built
- state captures: 152 interaction states, no page errors, no horizontal overflow at 320 to 1920

