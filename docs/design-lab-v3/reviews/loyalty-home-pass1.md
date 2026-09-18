# V3 review: Loyalty Home, pass 1

Reviewer: Astra, TapMart's design director.

Captures: loyalty-home-m-full.png, loyalty-home-d.png, home-states-m-none.png, home-states-d-live-empty.png, home-states-m-draft.png

**Verdict: fix.** Ten members, six repeat visitors, one reward ready and two redeemed. Add a visit. Further down, Jasmine’s Story source has four members, three returns and one redeemer.

## The ten questions

- Does this feel like a premium modern product? **partly**. The open layout and disciplined customer rows are strong. Chunky multicolour bars, a badge-like logo and duplicate Lab chrome dilute the finish.
- Does it explain itself without paragraphs? **yes**. Counts, progress, Free coffee and Add visit communicate the job immediately. Empty states are equally concise.
- Does it feel like a consumer platform, not business software? **partly**. Photography and simple names avoid CRM styling. The three differently coloured chart bars pull attribution back toward an analytics dashboard.
- Is it memorable? **partly**. The return story is distinctive, but the intended open-loop artwork and thin return descent have not survived implementation.
- Does motion improve understanding? **partly**. No motion strip or interaction recording was supplied. Static captures cannot establish motion quality.
- Does each earning type feel different? **partly**. Only a Story acquisition label appears here. Recreate, Story and Car earning compositions are outside these captures.
- Is business discovery exciting? **partly**. This is the operational Loyalty destination, not marketplace discovery. Its preservation must be reviewed on Business Home.
- Is Profile identity, not settings? **partly**. Neither Business Profile nor Personal Profile is shown.
- Does the website make someone keep scrolling? **partly**. No public website capture is included; the long phone overview is not evidence of the public sequence.
- Is it significantly stronger than current production? **partly**. The visible membership-to-return proposition is stronger. Complete workflow improvement and production comparison cannot be established from this overview alone.

## The five Loyalty questions

- Does this feel like a natural part of TapMart? **yes**. The paper canvas, familiar navigation, selected Business destination and editorial program object establish continuity. The duplicated phone header still needs correction.
- Does it strengthen the business value proposition? **yes**. The page connects acquisition to members, repeat activity and reward use instead of stopping at campaign attention.
- Can a business understand it quickly? **yes**. Four plain-language counts and one dominant counter action are clear. No-program and live-zero also identify the next useful action.
- Does it feel consumer quality rather than SaaS admin? **partly**. Unboxed metrics, photography and compact customer rows work. The coloured bar chart and floating Lab capsule weaken the consumer finish.
- Does attribution feel powerful without becoming fake analytics? **partly**. 4 Joined, 3 Came back and 1 Redeemed are legible and restrained, with no sales claims. Definitions, unique-member semantics and event reconciliation remain untested; the visual descent needs restoration.

## Scores

- motion understanding: 5
- slop risk: 3
- text discipline: 8
- natural part of tapmart: 8
- attribution honest power: 7
- memorable: 6
- quick to understand: 9
- self explaining: 8
- business value: 8
- wallet realism: 5
- truthfulness: 8
- consumer not software: 7
- premium: 7

## Spec drift

- Phone adds a full Loopday Coffee identity/search/messages/notifications row above the specified Loyalty header. Remove that row on Loyalty Home.
- Attribution uses approximately 20px-high phone bars and 28px-high desktop bars in ink, brick and lime. Replace them with uniform 3px ink rules and brick terminals.
- The program photograph occupies the full artwork band with a circular overlaid mark. Restore the 28% solid brand area and 72% photograph split.
- The absent-program mark is white inside a filled circular badge. Render the open ink loop directly on paper.
- The phone places View attribution above the descent instead of after it. Move it below the third lane.
- A floating Design Lab pill duplicates the fictional-context label. Consolidate into the context control and restore its disclosure affordance.
- The draft displays Last completed: Program rather than Last completed: Reward. Correct the saved fixture and Card-step resume behavior together.
- The desktop header omits the separate back control, and its title appears approximately 32px rather than 36px. Restore both.
- Desktop source labels are approximately secondary-fact size rather than the specified 16/24. Increase them without moving labels inside the rules.

## Spec was wrong

- The desktop vertical coordinates were too prescriptive. Keep the build’s compact recent/program starting position near y260 rather than moving it down to y296. Use content-led spacing so the working actions and their Wallet caption can fit together at 1440×900.
- The phone header instructions only allowed wrapping at text zoom. At 320px, also permit a second action row whenever Create program or Continue setup cannot fit beside the back target and title at their specified sizes. Never truncate or shrink those controls.

## Fixes

- 1. Replace the filled three-colour bars with 3px ink rules in 48px lanes. Give every positive rule a 12px brick terminal included within its measured length. Remove the lime fill and outline entirely. Preserve the 4:3:1 proportions and fixed external label column. (Joined from, phone and desktop): This is the signature object. The current chart assigns unsupported colour meanings and uses lime outside its functional role.
- 2. Remove the extra phone identity-and-utilities row on this route. Start with the 56px Back / Loyalty / primary-action header, followed by the 40px fictional-context strip. Use text-only Add visit without the extra plus. Restore the 32px count-region padding and section rhythm needed to place the program artwork near y672 at 390px. (Phone live, no-program and draft headers): The overview inherits an unnecessary marketplace header. Removing it must not collapse the intended breathing room or pull program copy into the first screen.
- 3. Rebuild the 2:1 artwork band with a solid ink left 28% containing the 48px open-loop mark and the photograph in the right 72%. Remove the circular logo badge over the photograph. For no-program, use the 64px ink-stroke loop directly on paper, without a filled disc. (Live and draft program artwork; no-program illustration): The current badge looks like a stamped G and replaces the intended branded object with a generic photo overlay.
- 4. Make Design Lab · Fictional preview the single operable Lab entrance, at 13/18 with a disclosure chevron and a 44px target. Remove the floating pill on this surface. (All supplied states, phone and desktop): Two Lab entrances repeat context, add an oversized capsule and shadow, and let QA chrome overlap the program photograph.
- 5. Set the supplied draft scenario to Program and Reward completed, display Last completed: Reward, and have Continue setup and Preview card open the Card step. Derive the caption from that same saved-step state. (Draft phone state and its destination actions): The capture says Last completed: Program, contradicting the specified fixture and its resume position. This must be a state correction, not merely a label replacement.
- 6. On phone, place the measured descent immediately after Jasmine and Story campaign, then put View attribution below the three lanes. On desktop, retain the identity beside the descent but set external labels to 16/24. (Joined from responsive composition): The phone currently offers the drill-down before showing the evidence. Desktop labels are visibly too small relative to the count and source hierarchy.
- 7. Restore a separate desktop back control with accessible name Back to Business Home. Keep Business in the breadcrumb linked to Business Profile. Set the Loyalty title to Bricolage Grotesque 600 at 36/41 and retain DM Sans for counts and UI. (Desktop page header): The desktop capture has no explicit return-to-marketplace control, and the title is smaller than the specified hierarchy. The breadcrumb and back action have different destinations.
- 8. Keep Send update and Wallet update · once a day together as one action group. After correcting the descent lanes, tighten excess source-section spacing rather than shrinking text so the complete group is visible at 1440×900. Preserve the live-zero no-audience explanation. (Desktop working-action row): The live desktop capture exposes Send update at the viewport edge while leaving its material channel-and-limit caption below the crop.

## Keep

- Warm paper, green-black typography, square photography and restrained underlined actions.
- Four unboxed counts in the correct order, showing 10, 6, 1 and 2.
- June, Ben and Imani with compact 0/5, 1/5 and 2/5 progress and no contact or source sublines.
- The desktop eight-column recent list beside the four-column program object.
- Five primary business destinations with Business selected and lime reserved for campaign Create.
- Honest no-program and live-zero compositions: no specimen customers, invented results or disabled dashboard clutter.
- The state-dependent Create program, Continue setup, View QR and Add visit actions.
- Jasmine’s visible 4/3/1 relationship, external count labels and absence of revenue claims.

## Why better than production

This gives the shop a visible return loop alongside advertising: who joined, who returned, whose reward is ready, and which source those members joined from. The screenshots make daily counter work and source-linked returns understandable without inventing sales or revenue. The working event logic is not yet proven by these captures.

## Remaining risks

- Scores use a 0 to 10 scale, with lower slop risk better. Motion understanding and Wallet realism are neutral placeholders because neither motion nor Wallet concepts appear in these captures.
- Only 390px phone and 1440px desktop examples are supplied. Approval still requires 320, 768, 1023 and 1920px captures plus the remaining state combinations.
- No Wallet card is shown, correctly for this surface. Do not add a miniature pass to improve its score; review platform realism on View program.
- Visible baseline counts reconcile with the supplied fixture, but screenshots cannot prove projections, idempotency, same-day handling, reward-version retention or redemption semantics.
- Count definitions, Live · simulated disclosure, Lab confirmation, routing, browser Back and restored scroll/focus need interaction evidence.
- Points, daily update allowance, recording failure, missing media and local-state error states are not shown.
- Measure first-screen words from actual viewport captures after the header correction. Do not infer an exact acceptance count from a full-page image or its fixed-layer placement.
- Verify the photograph source and revised crop in the media manifest. The current milk-pour subject reads clearly, but the specified split crop is not yet captured.
- Keyboard use, 200% text zoom, contrast, touch targets and reduced motion remain unverified. No fixed-bottom-bar placement in the full-page capture is treated as a product defect.
