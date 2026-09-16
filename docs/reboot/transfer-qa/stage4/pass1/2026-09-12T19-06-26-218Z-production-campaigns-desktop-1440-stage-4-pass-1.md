# Transfer QA: Production Campaigns (desktop 1440), stage 4 pass 1

Production: `d-business_campaigns.png` · Approved Lab: `d-design_lab_business_home-full.png` · Reviewer: Astra, design QA director · 2026-09-12T19:06:26.218Z
Instructions: Stage 4 transfers the approved Frame Shift Design Lab to production for the business workflows: Create, the three campaign creation flows, Campaigns, campaign detail, submission and proof review, car booking review, and direct requests. The Lab never drew these screens; judge the transfer of the approved language and composition to each screen's purpose (mineral canvas, graphite for media regions, cobalt only for commitment, the source-to-commitment joint, real media at source ratio, strong money hierarchy, short operational copy, literal status words, few borders, progressive disclosure, honest states) and whether real functionality survived. Real demo data replaces the Lab's fictional records; treat those as expected differences. Product rules that are not drift: approving a submission pays immediately and the button says the amount; confirming a car installation pays the first month; the platform fee comes out of the creator's payout, never on top of the pay; nothing is held when a campaign is published, publishing only needs credit for one payment; there is no approve-proof action for cars, driver photos are looked at, not approved; requests are labelled Request Story and Request Reel, never with a person's name; an ad is never drawn onto a real car, placements are shown on a diagram and artwork is shown as artwork. Do not propose a new design system. Three views: Active, Review, Completed with real counts. Rows led by the campaign's own media (reference or creative at 9:16, the vehicle photo, or the placement diagram), the kind and audience, the literal status, real progress, the one thing waiting on the business in cobalt, and the pay with its unit. Rows that need a decision come first with a cobalt edge. No summary tiles.

**Verdict.** Frame Shift is substantially present and visible Campaigns functionality survives, but this pass needs targeted money-hierarchy, row-consistency and action-clarity fixes before release.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** Hold release sign-off for the targeted corrections below, then recapture at 1440px. The screenshot supports preservation of visible workflow entry points, not verification of tab filtering, navigation destinations, backend counts or payment execution.

This is a strong language transfer rather than a screen-for-screen copy: the supplied Lab capture is Home, not Campaigns. The mineral/graphite shell, restrained cobalt, flat records, source ratios and shifted factual blocks are recognizable, while real counts, progress, payment units and review navigation remain visible. Sign-off is withheld primarily because money has lost its approved prominence, with smaller consistency and action-clarity defects remaining.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 8 |
| uniqueness | 7 |
| clarity | 8 |
| premium feel | 7 |
| fidelity | 7 |
| usability | 8 |
| brand recognition | 9 |
| ai slop risk | 1 |

## Keep

- The 200px graphite rail, restrained TapMart mark, 32px desktop gutter and mineral canvas closely match the approved shell.
- The application title and operational typography retain the approved hierarchy; rows remain flat, with quiet dividers and no floating cards.
- Source-led rows preserve portrait reference/creative ratios and landscape vehicle photographs without artificial media stages or artwork pasted onto cars.
- The approximately 24px downward shift from source to factual content carries the desktop source-to-commitment relationship without decorative notches.
- Decision-bearing rows appear first with a cobalt edge and cobalt next-action links. Kind, audience, literal Open status, progress and payment basis remain visible.
- Permanent navigation, business switching, the three counted views and review entry points remain exposed.

## Expected differences (real data)

- Campaigns correctly replaces the Lab Home discovery layout with Active 7, Review 5 and Completed 2. Discovery shelves, location controls and summary tiles are not required here.
- Demo Coffee Co., its D initial, campaign titles, audiences, progress, amounts and notification counts come from production records rather than the Lab’s fictional business and people.
- Actual BMW photographs, Story artwork and portrait Recreate references correctly replace the Lab’s marketplace imagery. Repeated sources are not inherently drift.
- The compact missing-media state is appropriate; it should not be replaced with invented imagery.
- The Lab’s fictional-marketplace disclaimer should not carry into production. Existing '[demo]' text in a stored campaign title is a data difference, not a reason to add demo labels elsewhere.

## Drift and usability

1. [drift] **Set campaign amounts to the approved desktop opportunity-pay style: Archivo 700, 34px/38px, tracking -0.02em, tabular lining numerals and #151B23. Keep payment units at IBM Plex Sans 14px/20px in #526171, directly beneath each amount and right-aligned. Preserve the actual values and units.** (Right-hand payment column throughout the campaign list.). The $250.00, $25.00, $110.00 and $75.00 amounts are currently approximately 18px and compete with task titles rather than anchoring the commitment. The payment bases are correctly explicit, but the money hierarchy is not.
2. [drift] **Reserve the same leading geometry for every row: border-inline-start: 3px solid transparent; padding-inline-start: 12px; box-sizing: border-box. Change only the border color to #2450E8 for rows requiring a decision. Keep source starts aligned at x247 and factual content at x343 in this viewport.** (Transition from the fifth decision row to the missing-media campaign at the bottom of the capture.). The first five decision rows align consistently, but the partially visible non-decision row starts its placeholder at x232 and its title around x328. Removing the decision edge currently shifts the entire content grid left by 15px.
2. [usability] **Generate the cobalt car action label from its actual pending backend step: use 'Review 1 booking' for booking review or 'Confirm 1 installation' for installation confirmation, with count-aware pluralization. Keep the list link as navigation into that task, not an immediate payment action.** (Cobalt action beneath 'Car ad on 2017 BMW 328i'.). '1 car waiting on you' supplies a count but does not identify what the business must do. Unlike 'Review 1 driver' or 'Review 1 video', it leaves the next decision ambiguous. The capture does not establish which car step is pending, so the label must follow the real state.
2. [drift] **Set the supplied Story creative thumbnail and its clipping wrapper to border-radius: 0px. Retain 4px corners for ordinary Recreate and vehicle source media.** (Thumbnail for 'Post our iced latte Story'.). The Story creative appears to inherit the same rounded thumbnail treatment as ordinary media. The approved system explicitly preserves supplied Story artwork as a square-cornered sheet.
