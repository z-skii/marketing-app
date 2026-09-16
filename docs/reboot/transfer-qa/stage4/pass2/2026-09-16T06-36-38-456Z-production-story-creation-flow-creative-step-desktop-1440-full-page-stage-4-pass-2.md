# Transfer QA: Production Story creation flow, creative step (desktop 1440, full page), stage 4 pass 2

Production: `d-create_story_1_creative.png` · Approved Lab: `d-design_lab_business_content-full.png` · Reviewer: Astra, design QA director · 2026-09-16T06:36:38.456Z
Instructions: Stage 4 transfers the approved Frame Shift Design Lab to production for the business workflows: Create, the three campaign creation flows, Campaigns, campaign detail, submission and proof review, car booking review, and direct requests. The Lab never drew these screens; judge the transfer of the approved language and composition to each screen's purpose (mineral canvas, graphite for media regions, cobalt only for commitment, the source-to-commitment joint, real media at source ratio, strong money hierarchy, short operational copy, literal status words, few borders, progressive disclosure, honest states) and whether real functionality survived. Real demo data replaces the Lab's fictional records; treat those as expected differences. Product rules that are not drift: approving a submission pays immediately and the button says the amount; confirming a car installation pays the first month; the platform fee comes out of the creator's payout, never on top of the pay; nothing is held when a campaign is published, publishing only needs credit for one payment; there is no approve-proof action for cars, driver photos are looked at, not approved; requests are labelled Request Story and Request Reel, never with a person's name; an ad is never drawn onto a real car, placements are shown on a diagram and artwork is shown as artwork. Do not propose a new design system. Pass 2 after fixes: Create is three source-to-commitment joints with an unmodified car photo and the placement on a diagram; every flow keeps the 24px desktop joint (12px on phones) between the source column and the decision column, attaches the pay to the source as a commitment caption, exposes Open reference, Open creative and View artwork controls, and states publishing credit literally; placement rows have visible checkboxes and a count; the funding plane leads with the amount and states any shortfall on its own line; Campaigns rows share one geometry with ink inspection links and labels from the real car step; campaign detail uses the approved joined-split source with the commitment plane; review screens use a wide source assembly and a narrow decision plane with the amount as the anchor and open controls for every file; the rear window is drawn as the rear windscreen. The demo Recreate submission is a real white-frame webm; that is the file. Check especially: financial meaning is accurate; approval wording matches the real financial consequence; no UI implies funds are escrowed or reserved; the creator-side platform fee is represented correctly; car installation and payment language is literal; the campaign credit state is understandable; progressive disclosure stays simple; Frame Shift fidelity is preserved; the composition works at the captured viewport; no generic form or dashboard drift. The supplied 9:16 creative is the first decision and stays in view. It can be replaced; drafts from the creative library are never offered, only approved creatives.

**Verdict.** Frame Shift is mostly preserved and visible functionality remains intact, but the detached payment caption prevents sign-off at this viewport.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** The capture exposes the creative, inspection, replacement, continuation, back navigation and business navigation without visible functionality loss. The arithmetic is correct, and nothing shown claims funds are reserved or adds a platform fee to the business payment. Fix the detached payment caption before release. Interaction testing must still verify approved-only library selection, replacement behavior and creative persistence through subsequent steps.

The shell, typography hierarchy, surfaces and control treatments transfer convincingly. The supplied Story is identifiable, fully visible and inspectable, and the decision begins exactly 24px beyond its edge. The screen avoids generic cards, excessive borders and invented status. However, the payment summary returns to the outer content area instead of following the source: the sheet starts at x440 while the money starts at x256. That conspicuous separation leaves the defining commitment caption unfinished despite otherwise sound execution.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 9 |
| uniqueness | 7 |
| clarity | 8 |
| premium feel | 7 |
| fidelity | 7 |
| usability | 8 |
| brand recognition | 9 |
| ai slop risk | 1 |

## Keep

- The mineral canvas, 200px graphite navigation rail, restrained mark and 32px application gutter closely match the approved shell.
- Keep the intact, approximately 240×427px creative with square corners and restrained source shadow; do not crop it or add a landscape media housing.
- Preserve the 24px gap between the creative’s right edge at x680 and the decision content beginning at x704.
- Keep Open creative in ink, Replace the creative as a bordered secondary action and Continue as the cobalt primary action.
- Keep the short operational explanation, visible step number and uncluttered progressive disclosure.
- Keep the prominent payment amount and its conditional basis: $25.00 per approved Story, $500.00 only if all 20 spots are approved.

## Expected differences (real data)

- The Lab shows Content review, not this creation flow. Step 1 of 8, Replace the creative and Continue appropriately replace review-specific fields and actions.
- Demo Coffee Co., its D initial and notification counts are production account data; Loopday Coffee and its fixture identity should not be copied.
- The supplied portrait Story correctly replaces the Lab’s landscape photography. Its embedded $4 promotion belongs to the artwork, not the campaign payment.
- The $25.00 payment, 20 spots and conditional $500.00 total reflect this campaign rather than Lab content.
- Funding and publishing controls need not appear on the first creative-selection step.

## Drift and usability

1. [drift] **Move the existing payment summary into the same 240px-wide source stack as the creative, provenance and Open creative control. Align its left edge with the sheet at x440 instead of x256; use width:100%, padding:0 and margin-top:16px after the inspection control. Remove the separate full-column placement. Retain the 44/48px amount, 14/20px payment basis, square structural edges and no shadow. Preserve the existing 24px source-to-decision gap.** (The $25.00 / per approved Story / $500.00 summary in the lower-left content area.). The amount is visually strong but sits 184px left of the creative, reading as an unrelated page-level balance rather than its attached commitment caption. This breaks the source-to-money relationship central to Frame Shift.
