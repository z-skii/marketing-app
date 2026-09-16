# Transfer QA: Production Recreate creation flow, funding step (phone 390, full page), stage 4 pass 2

Production: `m-create_recreate_6_funding.png` · Approved Lab: `d-design_lab_business_content-full.png` · Reviewer: Astra, design QA director · 2026-09-16T06:34:39.362Z
Instructions: Stage 4 transfers the approved Frame Shift Design Lab to production for the business workflows: Create, the three campaign creation flows, Campaigns, campaign detail, submission and proof review, car booking review, and direct requests. The Lab never drew these screens; judge the transfer of the approved language and composition to each screen's purpose (mineral canvas, graphite for media regions, cobalt only for commitment, the source-to-commitment joint, real media at source ratio, strong money hierarchy, short operational copy, literal status words, few borders, progressive disclosure, honest states) and whether real functionality survived. Real demo data replaces the Lab's fictional records; treat those as expected differences. Product rules that are not drift: approving a submission pays immediately and the button says the amount; confirming a car installation pays the first month; the platform fee comes out of the creator's payout, never on top of the pay; nothing is held when a campaign is published, publishing only needs credit for one payment; there is no approve-proof action for cars, driver photos are looked at, not approved; requests are labelled Request Story and Request Reel, never with a person's name; an ad is never drawn onto a real car, placements are shown on a diagram and artwork is shown as artwork. Do not propose a new design system. Pass 2 after fixes: Create is three source-to-commitment joints with an unmodified car photo and the placement on a diagram; every flow keeps the 24px desktop joint (12px on phones) between the source column and the decision column, attaches the pay to the source as a commitment caption, exposes Open reference, Open creative and View artwork controls, and states publishing credit literally; placement rows have visible checkboxes and a count; the funding plane leads with the amount and states any shortfall on its own line; Campaigns rows share one geometry with ink inspection links and labels from the real car step; campaign detail uses the approved joined-split source with the commitment plane; review screens use a wide source assembly and a narrow decision plane with the amount as the anchor and open controls for every file; the rear window is drawn as the rear windscreen. The demo Recreate submission is a real white-frame webm; that is the file. Check especially: financial meaning is accurate; approval wording matches the real financial consequence; no UI implies funds are escrowed or reserved; the creator-side platform fee is represented correctly; car installation and payment language is literal; the campaign credit state is understandable; progressive disclosure stays simple; Frame Shift fidelity is preserved; the composition works at the captured viewport; no generic form or dashboard drift. The funding plane: pay per approved video, spots, the total if every spot is approved, what the creator receives after the fee taken from the payout, credit now, the one payment needed to publish, what is still needed to cover every spot, and Add credit. The tab bar is pinned to the document end for this full-page capture only.

**Verdict.** Frame Shift and the real financial workflow largely survived, but the overflowing fee explanation blocks sign-off at the intended phone viewport.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** Do not ship the intended 390px phone layout until the horizontal overflow is fixed. Although the capture metadata says desktop, the visible shell is a phone composition. The Lab supplied here is a different workflow, so this assessment applies its shared language rather than requiring identical content or layout. Actions and states remain exposed; successful navigation, credit addition and backend mutations cannot be verified from a capture.

The transfer largely preserves Frame Shift's materials, typography, source treatment, offset relationship and money-first hierarchy without reverting to floating dashboard cards. Financial meaning is accurate: 10 × $50.00 is $500.00, the creator receives $42.50, publishing requires only $50.00 of credit, and nothing is described as reserved or escrowed. The visible controls preserve the workflow. However, the overflowing fee explanation expands the captured page beyond its phone shell, so the viewport transfer is not yet release-faithful.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 4 |
| media quality | 8 |
| uniqueness | 7 |
| clarity | 8 |
| premium feel | 6 |
| fidelity | 7 |
| usability | 6 |
| brand recognition | 7 |
| ai slop risk | 1 |

## Keep

- Mineral canvas, square white financial plane, restrained cobalt commitment edge, ink inspection link and shadow-free working regions.
- The identifiable portrait-ratio reference, restrained media corners and explicit Open reference control.
- The visible 12px phone inset connecting the source-aligned content to the payment and decision plane.
- Strong $50.00 hierarchy and the explicit $500.00 total only if all 10 spots are approved.
- Correct creator-side fee arithmetic: $42.50 received from a $50.00 payout after the 15% fee, with no fee added to business pay.
- Literal publishing semantics: only one payment's credit is required, nothing is held at publish, credit leaves upon approval, and the plan is billed separately.
- Add credit, Continue, Back and labeled primary navigation. The document-end tab placement is an intentional capture accommodation.

## Expected differences (real data)

- Demo Coffee Co., its D initial, campaign brief, deadline and Raleigh location replace the Lab's fictional business and records.
- The saved reference is explicitly an uploaded image. It need not match the Lab's delivered photography or the separate submission WebM mentioned in the brief.
- The real $17,887.00 credit balance covers both the $50.00 publishing minimum and the $500.00 conditional total, so both Covered states are appropriate.
- Step 6 of 7 exposes publishing credit and Continue rather than the Lab Content screen's review actions. This workflow had no direct Lab mockup.

## Drift and usability

1. [responsive] **Make the fee explanation a full-width wrapping row: white-space: normal; overflow-wrap: break-word; min-width: 0; max-width: 100%; grid-column: 1 / -1 if the ledger uses grid. Set min-width: 0 on its containing grid/flex child and box-sizing: border-box on the funding plane. Preserve the 16px phone gutters, 12px decision inset and 16px panel padding; at 390px the inset plane should remain 346px wide. Verify document.documentElement.scrollWidth equals clientWidth at 390px and 320px. Do not mask the defect with overflow-x: hidden.** (Publishing credit → Creator receives → platform-fee explanation). The sentence beginning “After the 15% TapMart fee” stays on one line and runs beyond the white funding plane into the right-hand canvas. Ordinary content and navigation occupy only the left portion of the expanded capture. This breaks the phone composition and makes essential fee information require horizontal travel or appear clipped.
